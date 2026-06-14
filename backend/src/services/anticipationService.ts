import prisma from '../prisma';
import { sendWhatsAppMessage } from './whatsapp';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const handleAnticipationOpportunity = async (cancelledAppointmentId: string) => {
  try {
    // 1. Get the cancelled appointment details
    const cancelledApp = await prisma.appointment.findUnique({
      where: { id: cancelledAppointmentId },
      include: { barber: true }
    });

    if (!cancelledApp) return;

    const slotStart = cancelledApp.startTime;
    const startOfDay = new Date(slotStart);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(slotStart);
    endOfDay.setHours(23, 59, 59, 999);

    // 2. Find customers with appointments LATER the same day with the SAME barber
    // ONLY registered customers (customerId not null)
    const candidates = await prisma.appointment.findMany({
      where: {
        barberId: cancelledApp.barberId,
        customerId: { not: null }, // Registered customers only
        startTime: {
          gt: slotStart,
          lte: endOfDay
        },
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      include: {
        service: true,
        barber: true
      }
    });

    for (const candidate of candidates) {
      // 3. Check if we already notified this customer for this specific slot
      const alreadyNotified = await prisma.anticipationNotification.findUnique({
        where: {
          appointmentId_slotId: {
            appointmentId: candidate.id,
            slotId: cancelledApp.id
          }
        }
      });

      if (alreadyNotified) continue;

      // 4. Send WhatsApp Notification
      const timeStr = format(slotStart, "HH:mm");
      const msg = `Olá ${candidate.customerName}! Uma vaga abriu mais cedo hoje com ${candidate.barber.name} às ${timeStr}. \n\nGostaria de antecipar seu agendamento de ${candidate.service.name}? \n\nResponda "SIM" para confirmar o interesse!`;

      console.log(`[Anticipation] Offering slot ${timeStr} to ${candidate.customerName} (originally at ${format(candidate.startTime, "HH:mm")})`);
      
      try {
        await sendWhatsAppMessage(candidate.customerPhone, msg);
        
        // 5. Register notification
        await prisma.anticipationNotification.create({
          data: {
            appointmentId: candidate.id,
            slotId: cancelledApp.id
          }
        });
      } catch (err: any) {
        console.error(`[Anticipation] Failed to notify ${candidate.customerName}:`, err.message);
      }
    }
  } catch (error) {
    console.error('[Anticipation] Error processing opportunity:', error);
  }
};
