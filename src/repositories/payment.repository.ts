import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import type { PaymentStatus } from '@/types/reservation.types';

interface CreatePaymentData {
  reservationId: string;
  amount: number;
  midtransOrderId: string;
  snapToken: string;
  status: PaymentStatus;
}

export class PaymentRepository {
  /**
   * Buat record Payment baru
   */
  async create(data: CreatePaymentData): Promise<Prisma.PaymentGetPayload<object>> {
    return prisma.payment.create({
      data,
    });
  }

  /**
   * Cari berdasarkan Order ID dari Midtrans
   */
  async findByOrderId(midtransOrderId: string): Promise<Prisma.PaymentGetPayload<{ include: { reservation: true } }> | null> {
    return prisma.payment.findUnique({
      where: { midtransOrderId },
      include: {
        reservation: true,
      },
    });
  }

  async findByReservationId(
    reservationId: string
  ): Promise<Prisma.PaymentGetPayload<object> | null> {
    return prisma.payment.findUnique({
      where: { reservationId },
    });
  }

  /**
   * Update status payment
   */
  async updateStatus(
    id: string,
    status: PaymentStatus,
    paidAt?: Date
  ): Promise<Prisma.PaymentGetPayload<object>> {
    return prisma.payment.update({
      where: { id },
      data: {
        status,
        paidAt,
      },
    });
  }

  async refreshToken(id: string, snapToken: string): Promise<Prisma.PaymentGetPayload<object>> {
    return prisma.payment.update({ where: { id }, data: { snapToken } });
  }
}
