import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createReservationSchema = z.object({
  doctorId: z.string().min(1, 'Dokter ID tidak boleh kosong'),
  tanggal: z.date().or(z.string().pipe(z.coerce.date())),
  jam: z
    .string()
    .regex(timeRegex, 'Format jam tidak valid (HH:MM)'),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
