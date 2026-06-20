import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

router.post('/', async (req, res) => {
  const { customerName, customerPhone, startTime, serviceId, barberId, customerId } = req.body;
  try {
    const entry = await prisma.waitingList.create({
      data: {
        customerName,
        customerPhone,
        startTime: new Date(startTime),
        serviceId,
        barberId,
        customerId,
        status: 'WAITING'
      }
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao entrar na fila de espera.' });
  }
});

export default router;
