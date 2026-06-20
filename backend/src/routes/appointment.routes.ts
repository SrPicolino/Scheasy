import { Router } from 'express';
import { createAppointment, getAppointments } from '../controllers/appointmentController';
import { updateAppointmentStatus } from '../controllers/adminController';
import { authMiddleware } from '../utils/auth';
import prisma from '../prisma';

const router = Router();

router.post('/', createAppointment);

router.get('/busy-slots', async (req, res) => {
  const { date, barberId } = req.query;
  if (!date || !barberId) return res.status(400).json({ error: 'Missing date or barberId' });
  
  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59`);
  const dateObj = new Date(`${date}T00:00:00`);
  const dayOfWeek = dateObj.getDay();

  const schedule = await prisma.workSchedule.findFirst({
    where: { barberId: barberId as string, dayOfWeek, isActive: true }
  });

  const appointments = await prisma.appointment.findMany({
    where: {
      barberId: barberId as string,
      status: { not: 'CANCELLED' },
      OR: [
        { startTime: { gte: startOfDay, lte: endOfDay } },
        { endTime: { gte: startOfDay, lte: endOfDay } },
        { AND: [{ startTime: { lte: startOfDay } }, { endTime: { gte: endOfDay } }] }
      ]
    },
    select: { startTime: true, endTime: true }
  });

  const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
  const bookedTimes: string[] = [];

  appointments.forEach(app => {
    const appStart = app.startTime.getHours() * 60 + app.startTime.getMinutes();
    const appEnd = app.endTime.getHours() * 60 + app.endTime.getMinutes();

    TIME_SLOTS.forEach(slot => {
      const [h, m] = slot.split(':').map(Number);
      const slotTime = h * 60 + m;
      
      if (slotTime >= appStart && slotTime < appEnd) {
        if (!bookedTimes.includes(slot)) {
          bookedTimes.push(slot);
        }
      }
    });
  });

  res.json({
    bookedTimes,
    schedule: schedule ? { start: schedule.startTime, end: schedule.endTime } : null
  });
});

router.get('/', authMiddleware, getAppointments);
router.patch('/:id/status', authMiddleware, updateAppointmentStatus);

export default router;
