import { z } from 'zod';

export const midtransWebhookSchema = z.object({
  order_id: z.string().min(1),
  status_code: z.string().min(1),
  gross_amount: z.string().min(1),
  signature_key: z.string().min(1),
  transaction_status: z.string().min(1),
  fraud_status: z.string().optional(),
});

export const createPaymentSchema = z.object({
  reservationId: z.string().min(1, 'Reservation ID tidak boleh kosong'),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
});

export type MidtransWebhookInput = z.infer<typeof midtransWebhookSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
