import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createScheduleSchema = z.object({
  hari: z.number().int().min(0).max(6),
  jamMulai: z.string().regex(timeRegex, 'Format jam tidak valid (HH:MM)'),
  jamSelesai: z.string().regex(timeRegex, 'Format jam tidak valid (HH:MM)'),
}).refine((d) => d.jamMulai < d.jamSelesai, {
  message: 'Jam mulai harus lebih awal dari jam selesai',
  path: ['jamMulai'],
});

export const updateScheduleSchema = z.object({
  hari: z.number().int().min(0).max(6).optional(),
  jamMulai: z.string().regex(timeRegex, 'Format jam tidak valid (HH:MM)').optional(),
  jamSelesai: z.string().regex(timeRegex, 'Format jam tidak valid (HH:MM)').optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
