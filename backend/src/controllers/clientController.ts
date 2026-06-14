import { Request, Response } from 'express';
import prisma from '../prisma';

export const getClientProfile = async (req: Request, res: Response) => {
  const { phone } = req.params;

  try {
    const customer = await prisma.customer.findUnique({
      where: { phone },
      include: {
        appointments: {
          include: { service: true, barber: true },
          orderBy: { startTime: 'desc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado. Faça um agendamento primeiro!' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar perfil do cliente' });
  }
};
