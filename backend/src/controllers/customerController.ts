import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendWhatsAppMessage } from '../services/whatsapp';
import { format } from 'date-fns';

import { customerRegistrationSchema } from '../validators/customer.validator';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export const registerCustomer = async (req: Request, res: Response) => {
  try {
    const validatedData = customerRegistrationSchema.parse(req.body);
    const { name, email, password, phone } = validatedData;
    const address = req.body.address; // optional, not in strict schema

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        isRegistered: true,
      },
    });

    const token = jwt.sign({ id: customer.id, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ customer, token });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validação falhou', details: error.errors });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'E-mail ou telefone já cadastrado.' });
    }
    res.status(500).json({ error: 'Falha ao registrar cliente.' });
  }
};

export const updateCustomerProfile = async (req: Request, res: Response) => {
  const customerId = (req as any).customerId;
  const { name, phone, address } = req.body;

  try {
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: { name, phone, address },
    });

    res.json(customer);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Este telefone já está em uso por outro cliente.' });
    }
    res.status(500).json({ error: 'Falha ao atualizar perfil.' });
  }
};

export const loginCustomer = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log(`[Customer Login] Attempt for email: ${email}`);

  try {
    const customer = await prisma.customer.findUnique({ where: { email } });
    
    if (!customer) {
      console.log(`[Customer Login] User not found: ${email}`);
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    if (!customer.password) {
      console.log(`[Customer Login] User has no password set (likely Google only): ${email}`);
      return res.status(401).json({ error: 'Esta conta usa login social. Entre com o Google.' });
    }

    const valid = await bcrypt.compare(password, customer.password);
    console.log(`[Customer Login] Password match for ${email}: ${valid}`);

    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ id: customer.id, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ customer, token });
  } catch (error) {
    console.error('[Customer Login] Error:', error);
    res.status(500).json({ error: 'Falha no login.' });
  }
};

export const getCustomerProfile = async (req: Request, res: Response) => {
  const customerId = (req as any).customerId;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        appointments: {
          include: { service: true, barber: true, rating: true },
          orderBy: { startTime: 'desc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
};

export const cancelAppointment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const customerId = (req as any).customerId;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { barber: true }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado.' });
    }

    if (appointment.customerId !== customerId) {
      return res.status(403).json({ error: 'Você não tem permissão para cancelar este agendamento.' });
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Agendamento já está cancelado.' });
    }

    // Update status
    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { barber: true, service: true }
    });

    // 1. Google Calendar Cleanup
    if (updated.googleEventId && updated.barber.googleTokens) {
      try {
        const { deleteCalendarEvent } = await import('../services/googleCalendar');
        const tokens = JSON.parse(updated.barber.googleTokens);
        await deleteCalendarEvent(tokens, updated.googleEventId);
        await prisma.appointment.update({
          where: { id: updated.id },
          data: { googleEventId: null }
        });
      } catch (err: any) {
        console.error('[Google Calendar] Sync failed on customer cancellation:', err.message);
      }
    }

    // 2. Notifications (WhatsApp) & Waiting List Logic
    const timeStr = format(updated.startTime, 'HH:mm');
    const dateStr = format(updated.startTime, 'dd/MM');
    
    // To Customer
    const clientMsg = `Olá ${updated.customerName}, seu agendamento para ${updated.service.name} em ${dateStr} às ${timeStr} foi CANCELADO conforme solicitado.`;
    await sendWhatsAppMessage(updated.customerPhone, clientMsg).catch(() => {});

    // Check waiting list for this specific slot
    const nextInLine = await prisma.waitingList.findFirst({
      where: {
        barberId: updated.barberId,
        startTime: updated.startTime,
        status: 'WAITING'
      },
      orderBy: { createdAt: 'asc' }
    });

    if (nextInLine) {
      const waitlistMsg = `Olá ${nextInLine.customerName}! O horário que você estava aguardando (${dateStr} às ${timeStr} com ${updated.barber.name}) acabou de ficar disponível devido a uma desistência. Acesse nosso site agora para agendar!`;
      await sendWhatsAppMessage(nextInLine.customerPhone, waitlistMsg).catch(err => {
        console.error('[WaitingList] Failed to notify:', err.message);
      });

      await prisma.waitingList.update({
        where: { id: nextInLine.id },
        data: { status: 'NOTIFIED' }
      });
    }

    // 3. Trigger Anticipation Logic
    const { handleAnticipationOpportunity } = await import('../services/anticipationService');
    handleAnticipationOpportunity(updated.id).catch(() => {});

    res.json({ message: 'Cancelado com sucesso', appointment: updated });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ error: 'Falha ao cancelar agendamento.' });
  }
};
