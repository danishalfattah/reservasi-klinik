export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'DONE' | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';

export type Role = 'PASIEN' | 'ADMIN' | 'DOKTER';

export interface Schedule {
  id: string;
  doctorId: string;
  hari: number; // 0=Minggu, 6=Sabtu
  jamMulai: string; // "HH:MM"
  jamSelesai: string; // "HH:MM"
}

export interface Doctor {
  id: string;
  userId: string;
  spesialis: string;
  tarif: number;
  durasiMenit: number;
  schedules: Schedule[];
}

export interface Reservation {
  id: string;
  pasienId: string;
  doctorId: string;
  tanggal: Date;
  jam: string; // "HH:MM"
  status: ReservationStatus;
  createdAt: Date;
}

/**
 * Input untuk membuat reservasi baru.
 * Dipanggil dari API route setelah validasi Zod.
 */
export interface CreateReservationInput {
  pasienId: string;
  doctorId: string;
  tanggal: Date;
  jam: string; // "HH:MM"
}

/**
 * Input untuk validasi reservasi (checking window, duplikat, dll).
 * Parameter `now` opsional untuk testability (default: new Date()).
 */
export interface ValidasiReservasiInput {
  pasienId: string;
  tanggal: Date;
  now?: Date;
}

/**
 * Result dari validasiReservasi().
 * Pattern ini memudahkan caller untuk handle multiple error cases tanpa try-catch berlapis.
 */
export interface ValidasiReservasiResult {
  valid: boolean;
  errorCode?: string;
  errorMessage?: string;
}

