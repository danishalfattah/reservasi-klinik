import Midtrans from 'midtrans-client';

export const snap = new Midtrans.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY ?? '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY ?? '',
});

export interface SnapTransactionParam {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail: string;
}

export async function createSnapToken(
  param: SnapTransactionParam
): Promise<string> {
  const response = (await snap.createTransaction({
    transaction_details: {
      order_id: param.orderId,
      gross_amount: param.grossAmount,
    },
    customer_details: {
      first_name: param.customerName,
      email: param.customerEmail,
    },
  })) as { token: string };

  return response.token;
}

interface MidtransStatusResponse { transaction_status: string; fraud_status?: string }
interface SnapWithTransaction { transaction: { status: (orderId: string) => Promise<unknown> } }

function resolveRawStatus(raw: MidtransStatusResponse): string {
  if (raw.transaction_status !== 'capture') return raw.transaction_status;
  return raw.fraud_status === 'accept' ? 'settlement' : 'pending';
}

export async function checkTransactionStatus(orderId: string): Promise<string> {
  const snapTx = (snap as unknown as SnapWithTransaction).transaction;
  const result = (await snapTx.status(orderId)) as MidtransStatusResponse;
  return resolveRawStatus(result);
}
