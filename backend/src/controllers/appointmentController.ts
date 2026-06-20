import { Request, Response } from 'express';
import prisma from '../prisma';
import { createCalendarEvent } from '../services/googleCalendar';
import { sendWhatsAppMessage } from '../services/whatsapp';

import { createAppointmentSchema } from '../validators/appointment.validator';
import { z } from 'zod';

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const validatedData = createAppointmentSchema.parse(req.body);
    const { customerName, customerPhone, startTime, serviceId, barberId, barbershopId } = validatedData;
    const wantsToRegister = req.body.wantsToRegister; // extra info not in schema

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const barber = await prisma.barber.findUnique({ where: { id: barberId } });
    if (!barber) return res.status(404).json({ error: 'Barber not found' });

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.duration * 60000);

    // Simple conflict check
    const conflict = await prisma.appointment.findFirst({
      where: {
        barberId,
        status: { not: 'CANCELLED' },
        OR: [
          { startTime: { lt: end }, endTime: { gt: start } }
        ]
      }
    });

    if (conflict) return res.status(400).json({ error: 'Barber is already busy at this time' });

    // Link or create customer (only if not a guest)
    let customerId = req.body.customerId;
    let customer = null;

    if (!customerId && wantsToRegister) {
      customer = await prisma.customer.upsert({
        where: { phone: customerPhone },
        update: { isRegistered: true, name: customerName, email: req.body.email },
        create: {
          phone: customerPhone,
          name: customerName,
          email: req.body.email,
          isRegistered: true
        }
      });
      customerId = customer.id;
    } else if (customerId) {
      customer = await prisma.customer.findUnique({ where: { id: customerId } });
    }

    const appointment = await prisma.appointment.create({
      data: {
        customerName,
        customerPhone,
        startTime: start,
        endTime: end,
        serviceId,
        barberId,
        barbershopId,
        customerId: customerId || null // null if Guest
      },
    });

    // 1. Send Confirmation WhatsApp (Optional)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'your_account_sid' && process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid') {
      const { formatInTimeZone } = await import('date-fns-tz');
      const dateStr = formatInTimeZone(start, 'America/Sao_Paulo', 'dd/MM/yyyy');
      const timeStr = formatInTimeZone(start, 'America/Sao_Paulo', 'HH:mm');
      const msg = `Olá ${customerName}! Recebemos seu pedido de agendamento para ${service.name} com ${barber.name} no dia ${dateStr} às ${timeStr}. Assim que for confirmado pelo barbeiro, você receberá uma nova mensagem!`;
      await sendWhatsAppMessage(customerPhone, msg).catch(err => console.error('WhatsApp failed:', err));
    }

    // 2. Add to Google Calendar (Optional)
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_client_id') {
      if (barber.googleTokens) {
        try {
          const tokens = typeof barber.googleTokens === 'string' ? JSON.parse(barber.googleTokens) : barber.googleTokens;
          const eventDetails = {
            summary: `${service.name} - ${customerName}`,
            description: `Cliente: ${customerName}\nTelefone: ${customerPhone}\nServiço: ${service.name}\nValor: R$ ${service.price}`,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
          };
          
          const event = await createCalendarEvent(tokens, eventDetails);
          if (event && event.id) {
            await prisma.appointment.update({
              where: { id: appointment.id },
              data: { googleEventId: event.id }
            });
            console.log(`[Google Calendar] Event created and ID saved for ${barber.name}`);
          }
        } catch (err: any) {
          console.error('[Google Calendar] Failed to create event:', err.message);
        }
      } else {
        console.log(`[DEBUG] No Google tokens found for barber ${barber.name}. Calendar event skipped.`);
      }
    }

    res.json(appointment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validação falhou', details: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

export const getAppointments = async (req: Request, res: Response) => {
  const { barbershopId } = req.query;
  try {
    const where = barbershopId ? { barbershopId: String(barbershopId) } : {};
    const appointments = await prisma.appointment.findMany({
      where,
      include: { service: true, barber: true, customer: true },
      orderBy: { startTime: 'asc' }
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};
