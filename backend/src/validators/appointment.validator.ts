import { z } from 'zod';

export const createAppointmentSchema = z.object({
  customerName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  customerPhone: z.string().min(10, "Telefone inválido"),
  startTime: z.string().datetime({ message: "Data de início inválida" }),
  endTime: z.string().datetime({ message: "Data de término inválida" }),
  serviceId: z.string().uuid("ID de serviço inválido"),
  barberId: z.string().uuid("ID de barbeiro inválido"),
  customerId: z.string().uuid("ID de cliente inválido").optional().nullable()
});

export type CreateAppointmentDTO = z.infer<typeof createAppointmentSchema>;
