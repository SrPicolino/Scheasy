import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createCalendarEvent, deleteCalendarEvent } from '../services/googleCalendar';
import { sendWhatsAppMessage } from '../services/whatsapp';
import { handleAnticipationOpportunity } from '../services/anticipationService';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  console.log(`[Login] Attempt for username: ${username}`);

  try {
    const admin = await prisma.admin.findFirst({ where: { username } });
    console.log(`[Login] User found: ${admin ? 'Yes' : 'No'}`);
    
    if (!admin) {
      console.log(`[Login] User not found: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    console.log(`[Login] Password valid: ${validPassword}`);
    
    if (!validPassword) {
      console.log(`[Login] Invalid password for user: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`[Login] Success for user: ${username}`);
    const token = jwt.sign({ id: admin.id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (error: any) {
    console.error(`[Login] Error: ${error.message}`);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // 1. Get the current state of the appointment before updating
    const previousAppointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!previousAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // 2. Perform the update
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: { service: true, barber: true, customer: true },
    });

    // Handle Loyalty Points on Completion
    // IMPORTANT: Only increment if status is changing TO 'COMPLETED' from something else
    // AND the customer is registered
    if (status === 'COMPLETED' && previousAppointment.status !== 'COMPLETED' && appointment.customerPhone) {
      const customerRecord = await prisma.customer.findUnique({
        where: { phone: appointment.customerPhone }
      });

      if (customerRecord?.isRegistered) {
        const customer = await prisma.customer.update({
          where: { phone: appointment.customerPhone },
          data: { loyaltyPoints: { increment: 1 } }
        });
        console.log(`[Loyalty] Points updated for ${customer.name}: ${customer.loyaltyPoints}`);
        
        // Notify about free cut if reached 10 points
        if (customer.loyaltyPoints % 10 === 0) {
          const promoMsg = `Parabéns ${customer.name}! Você completou 10 atendimentos e ganhou um CORTE GRÁTIS na sua próxima visita!`;
          await sendWhatsAppMessage(customer.phone, promoMsg).catch(err => console.error('Loyalty WhatsApp failed:', err));
        }
      } else {
        console.log(`[Loyalty] Skipping points for ${appointment.customerName}: Customer is not registered.`);
      }
    }

    // If status is CONFIRMED, trigger notifications and calendar sync
    if (status === 'CONFIRMED') {
      // 1. WhatsApp Notification
      const msg = `Olá ${appointment.customerName}! Seu agendamento de ${appointment.service.name} com ${appointment.barber.name} para o dia ${appointment.startTime.toLocaleDateString('pt-BR')} às ${appointment.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} foi CONFIRMADO. Te esperamos!`;
      await sendWhatsAppMessage(appointment.customerPhone, msg).catch(err => console.error('WhatsApp failed:', err));

      // 2. Google Calendar Sync
      if (appointment.barber.googleTokens && !appointment.googleEventId) {
        try {
          const tokens = JSON.parse(appointment.barber.googleTokens);
          const eventDetails = {
            summary: `${appointment.service.name} - ${appointment.customerName}`,
            description: `Cliente: ${appointment.customerName}\nTelefone: ${appointment.customerPhone}\nServiço: ${appointment.service.name}\nValor: R$ ${appointment.service.price}`,
            startTime: appointment.startTime.toISOString(),
            endTime: appointment.endTime.toISOString(),
          };
          
          const event = await createCalendarEvent(tokens, eventDetails);
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { googleEventId: event.id }
          });
          console.log(`[Google Calendar] Event created for ${appointment.barber.name} on confirmation`);
        } catch (err: any) {
          console.error('[Google Calendar] Sync failed on confirmation:', err.message);
        }
      }
    }

    // If status is CANCELLED, remove from Google Calendar if it exists and notify for early slots
    if (status === 'CANCELLED') {
      // Trigger anticipation logic asynchronously
      handleAnticipationOpportunity(id).catch(err => console.error('[Anticipation] Trigger failed:', err));

      if (appointment.googleEventId && appointment.barber.googleTokens) {
        try {
          const tokens = JSON.parse(appointment.barber.googleTokens);
          await deleteCalendarEvent(tokens, appointment.googleEventId);
          
          // Remove the event ID from the appointment record
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { googleEventId: null }
          });
          console.log(`[Google Calendar] Event removed for ${appointment.barber.name} on cancellation`);
        } catch (err: any) {
          console.error('[Google Calendar] Sync failed on cancellation:', err.message);
        }
      }
    }

    res.json(appointment);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};
