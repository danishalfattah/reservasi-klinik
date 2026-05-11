import { ReservationRepository } from '@/repositories/reservation.repository';
import { DoctorRepository } from '@/repositories/doctor.repository';
import { UserRepository } from '@/repositories/user.repository';
import { PaymentService } from '@/services/payment.service';
import { Role } from '@/generated/prisma/enums';

// ============================================================
// KONSTANTA ID
// ============================================================
export const DOCTOR_ID = 'cmp02nhh70001tgtrhvktv6eu';
export const PASIEN_ID = 'cmp02niei000mtgtr74jcpb1s';

// ============================================================
// TANGGAL TETAP
// ============================================================
export const TANGGAL_SENIN = new Date('2026-05-18');  // Senin  — hari kerja
export const TANGGAL_MINGGU = new Date('2026-05-17'); // Minggu — klinik tutup
export const TANGGAL_KAMIS = new Date('2026-06-18');  // Kamis  — dipakai untuk H+31
export const NOW = new Date('2026-05-11T00:00:00.000Z'); // Titik "hari ini" di semua test

// ============================================================
// DATA DUMMY
// ============================================================
export const mockDoctor = {
  id: DOCTOR_ID,
  userId: 'u1',
  spesialis: 'Dokter Umum',
  tarif: 150000,
  durasiMenit: 30,
  // Jadwal praktik: Senin (hari=1), 09:00–14:00
  schedules: [
    { id: 's1', doctorId: DOCTOR_ID, hari: 1, jamMulai: '09:00', jamSelesai: '14:00' },
  ],
  user: {
    id: 'u1',
    name: 'Dr. Andi',
    email: 'dr.andi@test.com',
    role: 'DOKTER' as Role,
    phone: null,
    password: 'hashed',
    createdAt: new Date(),
  },
};

export const mockPasien = {
  id: PASIEN_ID,
  name: 'Pasien Satu',
  email: 'patient1@test.com',
  role: 'PASIEN' as Role,
  phone: null,
  password: 'hashed',
  createdAt: new Date(),
};

export const mockReservation = {
  id: 'rsv-001',
  pasienId: PASIEN_ID,
  doctorId: DOCTOR_ID,
  tanggal: TANGGAL_SENIN,
  jam: '09:00',
  status: 'PENDING' as const,
  nomorAntrian: 1,
  createdAt: new Date(),
};

// ============================================================
// MOCK FACTORIES
// Menggunakan jest.Mocked<T> agar .mockResolvedValue() dikenali TypeScript.
// ============================================================
export function makeMockReservationRepo(): jest.Mocked<ReservationRepository> {
  return {
    findActiveByDoctorTanggalJam: jest.fn(),
    findActiveByPasienTanggal: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdWithDetails: jest.fn(),
    findByIdForPayment: jest.fn(),
    update: jest.fn(),
    findAllByPasienId: jest.fn(),
    findAllByDoctorId: jest.fn(),
  } as jest.Mocked<ReservationRepository>;
}

export function makeMockDoctorRepo(): jest.Mocked<DoctorRepository> {
  return {
    findByIdWithSchedules: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    emailExists: jest.fn(),
  } as jest.Mocked<DoctorRepository>;
}

export function makeMockUserRepo(): jest.Mocked<UserRepository> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    createWithDoctorProfile: jest.fn(),
    findByIdWithDoctor: jest.fn(),
    updateById: jest.fn(),
    updateDoctorProfile: jest.fn(),
    findAllByRole: jest.fn(),
  } as jest.Mocked<UserRepository>;
}

export function makeMockPaymentService(): jest.Mocked<PaymentService> {
  return {
    buatPayment: jest.fn(),
    buatPaymentByReservationId: jest.fn(),
    verifyAndUpdateByOrderId: jest.fn(),
    getPaymentStatus: jest.fn(),
    handleWebhook: jest.fn(),
  } as unknown as jest.Mocked<PaymentService>;
}
