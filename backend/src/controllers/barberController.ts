import { Request, Response } from 'express';
import prisma from '../prisma';

export const getBarbers = async (req: Request, res: Response) => {
  try {
    const barbers = await prisma.barber.findMany();
    res.json(barbers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch barbers' });
  }
};

export const createBarber = async (req: Request, res: Response) => {
  const { name, email, googleCalendarId } = req.body;
  try {
    const barber = await prisma.barber.create({
      data: { name, email, googleCalendarId },
    });
    res.json(barber);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create barber' });
  }
};
