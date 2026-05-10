export const BOOKING_MIN_DAYS_AHEAD = 1;
export const BOOKING_MAX_DAYS_AHEAD = 30;
export const BOOKING_CUTOFF_HOURS = 1;
export const MAKSIMUM_RESERVASI_AKTIF_PER_HARI = 1;

type JamOperasional = {
  buka: string;
  tutup: string;
} | null;

export const JAM_OPERASIONAL: Record<number, JamOperasional> = {
  0: null, // Minggu tutup
  1: { buka: '08:00', tutup: '17:00' },
  2: { buka: '08:00', tutup: '17:00' },
  3: { buka: '08:00', tutup: '17:00' },
  4: { buka: '08:00', tutup: '17:00' },
  5: { buka: '08:00', tutup: '17:00' },
  6: { buka: '08:00', tutup: '12:00' }, // Sabtu setengah hari
} as const;
