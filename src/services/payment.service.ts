import crypto from 'crypto';

import { createSnapToken, checkTransactionStatus } from '@/lib/midtrans';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { PaymentRepository } from '@/repositories/payment.repository';
import { ReservationRepository } from '@/repositories/reservation.repository';
import type { MidtransWebhookInput } from '@/validators/payment.validator';
import type { PaymentStatus, ReservationStatus } from '@/types/reservation.types';
import type { Prisma } from '@/generated/prisma/client';

interface StatusUpdate {
  paymentStatus: PaymentStatus;
  reservationStatus: ReservationStatus;
  paidAt?: Date;
}

function verifyMidtransSignature(notification: MidtransWebhookInput): void {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const hash = crypto
    .createHash('sha512')
    .update(`${notification.order_id}${notification.status_code}${notification.gross_amount}${serverKey}`)
    .digest('hex');

  if (hash !== notification.signature_key) {
    throw new ValidationError('INVALID_SIGNATURE', 'Signature key Midtrans tidak valid');
  }
}

function isInvalidToken(token: string): boolean {
  return token.length === 0 || token.startsWith('seed-snap-');
}

function buildOrderId(reservationId: string, existingOrderId?: string): string {
  if (existingOrderId && !existingOrderId.startsWith('seed-order-')) return existingOrderId;
  return `TRX-RSV-${reservationId}`;
}

function resolveStatus(notification: MidtransWebhookInput): StatusUpdate {
  const statusMap: Record<string, StatusUpdate> = {
    settlement: { paymentStatus: 'PAID', reservationStatus: 'CONFIRMED', paidAt: new Date() },
    expire: { paymentStatus: 'EXPIRED', reservationStatus: 'PENDING' },
    cancel: { paymentStatus: 'FAILED', reservationStatus: 'PENDING' },
    deny: { paymentStatus: 'FAILED', reservationStatus: 'PENDING' },
    pending: { paymentStatus: 'PENDING', reservationStatus: 'PENDING' },
  };
  if (notification.transaction_status === 'capture') {
    if (notification.fraud_status !== 'accept') return statusMap.pending;
    return { paymentStatus: 'PAID', reservationStatus: 'CONFIRMED', paidAt: new Date() };
  }
  return statusMap[notification.transaction_status] ?? statusMap.pending;
}

export class PaymentService {
  constructor(
    private paymentRepo: PaymentRepository,
    private reservationRepo: ReservationRepository
  ) {}

  async buatPayment(
    reservation: Prisma.ReservationGetPayload<object>,
    doctor: Prisma.DoctorGetPayload<object>,
    pasien: Prisma.UserGetPayload<object>
  ): Promise<{ snapToken: string; midtransOrderId: string }> {
    const existing = await this.paymentRepo.findByReservationId(reservation.id);
    if (existing && existing.status === 'PAID') return { snapToken: existing.snapToken, midtransOrderId: existing.midtransOrderId };
    if (existing && !isInvalidToken(existing.snapToken)) return { snapToken: existing.snapToken, midtransOrderId: existing.midtransOrderId };

    const orderId = buildOrderId(reservation.id, existing?.midtransOrderId);
    const snapToken = await createSnapToken({
      orderId, grossAmount: doctor.tarif,
      customerName: pasien.name, customerEmail: pasien.email,
    });

    await this.persistPayment(existing, { reservationId: reservation.id, amount: doctor.tarif, orderId, snapToken });
    return { snapToken, midtransOrderId: orderId };
  }

  private async persistPayment(
    existing: Prisma.PaymentGetPayload<object> | null,
    data: { reservationId: string; amount: number; orderId: string; snapToken: string }
  ): Promise<void> {
    if (existing) {
      await this.paymentRepo.refreshToken(existing.id, data.snapToken);
      return;
    }
    await this.paymentRepo.create({
      reservationId: data.reservationId, amount: data.amount,
      midtransOrderId: data.orderId, snapToken: data.snapToken, status: 'PENDING',
    });
  }

  async buatPaymentByReservationId(reservationId: string): Promise<{ snapToken: string }> {
    const reservation = await this.reservationRepo.findByIdForPayment(reservationId);
    if (!reservation) throw new NotFoundError('Reservasi tidak ditemukan');
    return this.buatPayment(reservation, reservation.doctor, reservation.pasien);
  }

  async verifyAndUpdateByOrderId(orderId: string): Promise<void> {
    const transactionStatus = await checkTransactionStatus(orderId);
    const payment = await this.paymentRepo.findByOrderId(orderId);
    if (!payment) throw new NotFoundError('Transaksi tidak ditemukan');
    const fakeNotif = { transaction_status: transactionStatus, fraud_status: 'accept' } as MidtransWebhookInput;
    const update = resolveStatus(fakeNotif);
    await this.paymentRepo.updateStatus(payment.id, update.paymentStatus, update.paidAt);
    await this.reservationRepo.update(payment.reservationId, { status: update.reservationStatus });
  }

  async getPaymentStatus(orderId: string): Promise<Prisma.PaymentGetPayload<{ include: { reservation: true } }>> {
    const payment = await this.paymentRepo.findByOrderId(orderId);
    if (!payment) throw new NotFoundError('Transaksi pembayaran tidak ditemukan');
    return payment;
  }

  async handleWebhook(notification: MidtransWebhookInput): Promise<void> {
    verifyMidtransSignature(notification);

    const payment = await this.paymentRepo.findByOrderId(notification.order_id);
    if (!payment) throw new NotFoundError('Transaksi pembayaran tidak ditemukan');

    const update = resolveStatus(notification);
    if (update.paymentStatus !== payment.status) {
      await this.paymentRepo.updateStatus(payment.id, update.paymentStatus, update.paidAt);
    }

    if (update.reservationStatus !== payment.reservation.status) {
      await this.reservationRepo.update(payment.reservationId, { status: update.reservationStatus });
    }
  }
}
