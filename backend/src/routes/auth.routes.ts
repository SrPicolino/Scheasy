import { Router } from 'express';
import { login } from '../controllers/adminController';
import { getAuthUrl, setTokens } from '../services/googleCalendar';
import prisma from '../prisma';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

router.post('/login', login);

router.get('/google', (req, res) => {
  res.redirect(getAuthUrl('admin'));
});

router.get('/google/customer', (req, res) => {
  res.redirect(getAuthUrl('customer'));
});

router.get('/callback', async (req, res) => {
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
    console.log(`[Google Auth] Callback for email: ${email}`);
    
    const barber = await prisma.barber.findUnique({ where: { email } });
    if (barber) {
      console.log(`[Google Auth] Matching barber found: ${barber.name}. Saving tokens...`);
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
          const { createCalendarEvent } = await import('../services/googleCalendar');
          const event = await createCalendarEvent(tokens, {
            summary: `${app.service.name} - ${app.customerName}`,
            description: `Cliente: ${app.customerName}\nTelefone: ${app.customerPhone}`,
            startTime: app.startTime.toISOString(),
            endTime: app.endTime.toISOString(),
          });
          await prisma.appointment.update({ where: { id: app.id }, data: { googleEventId: event.id } });
        } catch (err) {
          console.error(`[Google Auth] Failed to back-sync appointment ${app.id}:`, err instanceof Error ? err.message : String(err));
        }
      }
    } else {
      console.warn(`[Google Auth] No barber found in database with email: ${email}. Tokens NOT saved.`);
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

export default router;
