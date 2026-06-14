import { Request, Response } from 'express';
import prisma from '../prisma';

export const createRating = async (req: Request, res: Response) => {
  const { appointmentId, score, comment } = req.body;
  const customerId = (req as any).customerId;

  if (!customerId) {
    return res.status(403).json({ error: 'Apenas clientes cadastrados podem avaliar o serviço.' });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.customerId !== customerId) {
      return res.status(403).json({ error: 'Você não tem permissão para avaliar este agendamento.' });
    }

    const rating = await prisma.rating.create({
      data: {
        appointmentId,
        score,
        comment,
      },
    });

    res.json(rating);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Rating already exists for this appointment' });
    }
    res.status(500).json({ error: 'Failed to create rating' });
  }
};

export const getRatings = async (req: Request, res: Response) => {
  const { barberId, page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  try {
    const where: any = {};
    if (barberId) {
      where.appointment = { barberId: String(barberId) };
    }

    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where,
        include: {
          appointment: {
            include: {
              barber: true,
              service: true,
              customer: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.rating.count({ where }),
    ]);

    res.json({
      ratings,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
};

export const getRatingsStats = async (req: Request, res: Response) => {
  try {
    const barbers = await prisma.barber.findMany({
      include: {
        appointments: {
          include: {
            rating: true,
          },
        },
      },
    });

    const stats = barbers.map((barber) => {
      const ratings = barber.appointments
        .map((app) => app.rating)
        .filter((r) => r !== null) as any[];

      const total = ratings.length;
      const average = total > 0 
        ? ratings.reduce((sum, r) => sum + r.score, 0) / total 
        : 0;

      return {
        barberId: barber.id,
        barberName: barber.name,
        average: Number(average.toFixed(1)),
        total,
      };
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rating stats' });
  }
};
