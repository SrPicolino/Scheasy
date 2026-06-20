import { z } from 'zod';

export const customerRegistrationSchema = z.object({
  email: z.string().email("E-mail inválido"),
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  phone: z.string().min(10, "Telefone inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").optional(),
});

export type CustomerRegistrationDTO = z.infer<typeof customerRegistrationSchema>;
