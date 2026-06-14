import cron from 'node-cron';
import prisma from '../prisma';
import { sendWhatsAppMessage } from './whatsapp';
import { subHours, addMinutes, startOfMinute } from 'date-fns';

export const initReminderJob = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const oneHourFromNowStart = addMinutes(startOfMinute(now), 60);
    const oneHourFromNowEnd = addMinutes(oneHourFromNowStart, 1);

    try {
      const upcomingAppointments = await prisma.appointment.findMany({
        where: {
          startTime: {
            gte: oneHourFromNowStart,
            lt: oneHourFromNowEnd,
          },
          status: 'CONFIRMED',
        },
        include: {
          service: true,
          barber: true,
        },
      });

      for (const appointment of upcomingAppointments) {
        const msg = `Olá ${appointment.customerName}! Lembrete: Seu agendamento de ${appointment.service.name} com ${appointment.barber.name} está marcado para às ${appointment.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} hoje. Te esperamos!`;
        
        console.log(`Sending reminder to ${appointment.customerPhone}...`);
        
        // Only attempt to send if Twilio is configured
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'your_account_sid') {
          await sendWhatsAppMessage(appointment.customerPhone, msg);
        } else {
          console.log('[DEBUG] Twilio not configured. Message would be:', msg);
        }
      }
    } catch (error) {
      console.error('Error in reminder job:', error);
    }
  });
};
