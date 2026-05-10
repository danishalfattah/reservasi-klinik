import { z } from 'zod';

const baseRegisterSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  phone: z.string().optional(),
});

export const registerSchema = z.discriminatedUnion('role', [
  baseRegisterSchema.extend({ role: z.literal('PASIEN') }),
  baseRegisterSchema.extend({ role: z.literal('ADMIN') }),
  baseRegisterSchema.extend({
    role: z.literal('DOKTER'),
    spesialis: z.string().min(2, 'Spesialisasi tidak boleh kosong'),
    tarif: z.number().positive('Tarif harus lebih dari 0'),
    durasiMenit: z.number().positive('Durasi harus lebih dari 0'),
  }),
]);

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password tidak boleh kosong'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
