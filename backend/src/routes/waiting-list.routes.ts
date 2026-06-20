import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

/**
 * POST /api/waiting-list
 * Adds a customer to the waiting list for a specific barbershop slot
 */
router.post('/', async (req, res) => {
  const { customerName, customerPhone, startTime, serviceId, barberId, customerId, barbershopId } = req.body;

  if (!barbershopId) {
    return res.status(400).json({ error: 'barbershopId é obrigatório.' });
  }

  try {
    const entry = await prisma.waitingList.create({
      data: {
        customerName,
        customerPhone,
        startTime: new Date(startTime),
        serviceId,
        barberId,
        barbershopId,
        customerId,
        status: 'WAITING'
      }
    });
    res.json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao entrar na fila de espera.' });
  }
});

export default router;
