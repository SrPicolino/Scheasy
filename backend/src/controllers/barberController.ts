import { Request, Response } from 'express';
import prisma from '../prisma';

/**
 * GET /api/barbers?barbershopId=xxx
 * Returns barbers filtered by barbershopId (required for multi-tenant)
 */
export const getBarbers = async (req: Request, res: Response) => {
  const { barbershopId } = req.query;
  try {
    const where = barbershopId ? { barbershopId: String(barbershopId) } : {};
    const barbers = await prisma.barber.findMany({
      where,
      include: { schedules: true }
    });
    res.json(barbers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch barbers' });
  }
};

/**
 * POST /api/barbers
 * Creates a barber associated with a specific barbershop
 */
export const createBarber = async (req: Request, res: Response) => {
  const { name, email, googleCalendarId, barbershopId } = req.body;

  if (!barbershopId) {
    return res.status(400).json({ error: 'barbershopId é obrigatório.' });
  }

  try {
    const barber = await prisma.barber.create({
      data: { name, email, googleCalendarId, barbershopId },
    });
    res.status(201).json(barber);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create barber' });
  }
};
