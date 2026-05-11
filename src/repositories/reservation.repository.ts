import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import type { ReservationStatus } from '@/types/reservation.types';

export type ReservationWithAll = Prisma.ReservationGetPayload<{
  include: { pasien: true; doctor: { include: { user: true; schedules: true } } };
}>;

export type ReservationWithPasien = Prisma.ReservationGetPayload<{
  include: { pasien: true };
}>;

export type ReservationWithDoctor = Prisma.ReservationGetPayload<{
  include: { doctor: { include: { user: true } }; payment: true };
}>;

export type ReservationPaymentContext = Prisma.ReservationGetPayload<{
  include: { pasien: true; doctor: true; payment: true };
}>;

interface CreateReservationData {
  pasienId: string;
  doctorId: string;
  tanggal: Date;
  jam: string;
  status: ReservationStatus;
}

interface UpdateReservationData {
  status?: ReservationStatus;
}

/**
 * ReservationRepository — Thin wrapper around Prisma untuk operasi reservasi.
 * Semua method yang query berdasarkan status, otomatis filter PENDING/CONFIRMED saja (status aktif).
 */
export class ReservationRepository {
  /**
   * Cari reservasi aktif (PENDING/CONFIRMED) untuk dokter pada tanggal & jam tertentu.
   * Dipakai untuk cek apakah slot sudah terisi.
   */
  async findActiveByDoctorTanggalJam(
    doctorId: string,
    tanggal: Date,
    jam: string
  ): Promise<Prisma.ReservationGetPayload<object>[]> {
    const startOfDay = new Date(
      tanggal.getFullYear(),
      tanggal.getMonth(),
      tanggal.getDate()
    );
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return prisma.reservation.findMany({
      where: {
        doctorId,
        tanggal: {
          gte: startOfDay,
          lt: endOfDay,
        },
        jam,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });
  }

  /**
   * Cari semua reservasi aktif (PENDING/CONFIRMED) untuk pasien pada tanggal tertentu.
   * Dipakai untuk cek duplikat (1 reservasi per pasien per hari).
   */
  async findActiveByPasienTanggal(
    pasienId: string,
    tanggal: Date
  ): Promise<Prisma.ReservationGetPayload<object>[]> {
    const startOfDay = new Date(
      tanggal.getFullYear(),
      tanggal.getMonth(),
      tanggal.getDate()
    );
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return prisma.reservation.findMany({
      where: {
        pasienId,
        tanggal: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });
  }

  /**
   * Buat reservasi baru dengan status PENDING (belum dibayar).
   */
  async create(data: CreateReservationData): Promise<Prisma.ReservationGetPayload<object>> {
    return prisma.reservation.create({
      data: {
        pasienId: data.pasienId,
        doctorId: data.doctorId,
        tanggal: data.tanggal,
        jam: data.jam,
        status: data.status,
      },
    });
  }

  /**
   * Cari reservasi berdasarkan ID.
   */
  async findById(id: string): Promise<Prisma.ReservationGetPayload<object> | null> {
    return prisma.reservation.findUnique({
      where: { id },
    });
  }

  async findByIdWithDetails(
    id: string
  ): Promise<ReservationWithDoctor | null> {
    return prisma.reservation.findUnique({
      where: { id },
      include: { doctor: { include: { user: true } }, payment: true },
    });
  }

  async findByIdForPayment(
    id: string
  ): Promise<ReservationPaymentContext | null> {
    return prisma.reservation.findUnique({
      where: { id },
      include: { pasien: true, doctor: true, payment: true },
    });
  }

  /**
   * Update status atau field lain dari reservasi yang sudah ada.
   */
  async update(
    id: string,
    data: UpdateReservationData
  ): Promise<Prisma.ReservationGetPayload<object>> {
    return prisma.reservation.update({
      where: { id },
      data,
    });
  }

  /**
   * Cari semua reservasi berdasarkan pasienId (termasuk yang sudah selesai/dibatalkan).
   * Dipakai untuk riwayat reservasi pasien.
   */
  async findAllByPasienId(
    pasienId: string
  ): Promise<ReservationWithDoctor[]> {
    return prisma.reservation.findMany({
      where: { pasienId },
      orderBy: { createdAt: 'desc' },
      include: { doctor: { include: { user: true } }, payment: true },
    });
  }

  async findAllByDoctorId(
    doctorId: string,
    tanggal?: Date
  ): Promise<ReservationWithPasien[]> {
    const where: Prisma.ReservationWhereInput = { doctorId };
    if (tanggal) {
      const start = new Date(tanggal.getFullYear(), tanggal.getMonth(), tanggal.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.tanggal = { gte: start, lt: end };
    }
    return prisma.reservation.findMany({
      where,
      orderBy: [{ tanggal: 'asc' }, { jam: 'asc' }],
      include: { pasien: true },
    });
  }
}
