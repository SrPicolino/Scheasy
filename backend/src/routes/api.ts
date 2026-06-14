import { Router } from 'express';
import { getServices, createService, updateService, deleteService } from '../controllers/serviceController';
import { getBarbers, createBarber } from '../controllers/barberController';
import { createAppointment, getAppointments } from '../controllers/appointmentController';
import { createRating, getRatings, getRatingsStats } from '../controllers/ratingController';
import { registerCustomer, loginCustomer, getCustomerProfile, cancelAppointment } from '../controllers/customerController';
import { getAuthUrl, setTokens } from '../services/googleCalendar';
import { login, updateAppointmentStatus } from '../controllers/adminController';
import { authMiddleware, customerAuthMiddleware } from '../utils/auth';
import prisma from '../prisma';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Public routes
router.get('/services', getServices);
router.get('/barbers', getBarbers);
router.post('/appointments', createAppointment);

router.get('/appointments/busy-slots', async (req, res) => {
  const { date, barberId } = req.query;
  if (!date || !barberId) return res.status(400).json({ error: 'Missing date or barberId' });
  
  const dateObj = new Date(`${date}T00:00:00`);
  const dayOfWeek = dateObj.getDay();
  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59`);

  const schedule = await prisma.workSchedule.findFirst({
    where: { barberId: barberId as string, dayOfWeek, isActive: true }
  });

  const busy = await prisma.appointment.findMany({
    where: {
      barberId: barberId as string,
      startTime: { gte: startOfDay, lte: endOfDay },
      status: { not: 'CANCELLED' }
    },
    select: { startTime: true }
  });

  const bookedTimes = busy.map(b => {
    const hours = b.startTime.getHours().toString().padStart(2, '0');
    const minutes = b.startTime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  });

  res.json({
    bookedTimes,
    schedule: schedule ? { start: schedule.startTime, end: schedule.endTime } : null
  });
});

router.post('/login', login);
router.post('/customer/register', registerCustomer);
router.post('/customer/login', loginCustomer);

// Google OAuth
router.get('/auth/google', (req, res) => {
  res.redirect(getAuthUrl('admin'));
});

router.get('/auth/google/customer', (req, res) => {
  res.redirect(getAuthUrl('customer'));
});

router.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  try {
    const tokens = await setTokens(code as string);
    
    // Get user info from Google
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const googleUser = await googleRes.json();

    if (state === 'customer') {
      let customer = await prisma.customer.findUnique({ where: { email: googleUser.email } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            email: googleUser.email,
            name: googleUser.name,
            googleId: googleUser.id,
            phone: '', // Needs to be filled later
            isRegistered: true
          }
        });
      }
      const token = jwt.sign({ id: customer.id, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
      return res.send(`
        <script>
          localStorage.setItem('customerToken', '${token}');
          window.location.href = 'http://localhost:5173/my-account';
        </script>
      `);
    }

    // Admin/Barber Flow
    const email = googleUser.email;
    const barber = await prisma.barber.findUnique({ where: { email } });
    if (barber) {
      await prisma.barber.update({
        where: { id: barber.id },
        data: { googleTokens: JSON.stringify(tokens) }
      });
      // Back-sync CONFIRMED appointments...
      const confirmedApps = await prisma.appointment.findMany({
        where: { barberId: barber.id, status: 'CONFIRMED', googleEventId: null },
        include: { service: true }
      });
      for (const app of confirmedApps) {
        try {
          const { createCalendarEvent } = await import('../services/googleCalendar.js');
          const event = await createCalendarEvent(tokens, {
            summary: `${app.service.name} - ${app.customerName}`,
            description: `Cliente: ${app.customerName}\nTelefone: ${app.customerPhone}`,
            startTime: app.startTime.toISOString(),
            endTime: app.endTime.toISOString(),
          });
          await prisma.appointment.update({ where: { id: app.id }, data: { googleEventId: event.id } });
        } catch (err) {}
      }
    }

    res.send(`
      <script>
        alert('Google Agenda conectado com sucesso!');
        window.location.href = 'http://localhost:5173/admin';
      </script>
    `);
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).send('Erro na autenticação com o Google.');
  }
});

// Protected Customer routes
router.get('/customer/profile', customerAuthMiddleware, getCustomerProfile);
router.post('/customer/appointments/:id/cancel', customerAuthMiddleware, cancelAppointment);
router.post('/ratings', customerAuthMiddleware, createRating);


router.get('/appointments', authMiddleware, getAppointments);
router.patch('/appointments/:id/status', authMiddleware, updateAppointmentStatus);
router.post('/services', authMiddleware, createService);
router.put('/services/:id', authMiddleware, updateService);
router.delete('/services/:id', authMiddleware, deleteService);
router.post('/barbers', authMiddleware, createBarber);
router.get('/ratings', authMiddleware, getRatings);
router.get('/ratings/stats', authMiddleware, getRatingsStats);

export default router;
