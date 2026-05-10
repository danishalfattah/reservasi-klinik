declare module 'midtrans-client' {
  interface SnapTransactionRequest {
    transaction_details: {
      order_id: string;
      gross_amount: number;
    };
    customer_details: {
      first_name: string;
      email: string;
    };
  }

  interface SnapTransactionResponse {
    token: string;
  }

  export class Snap {
    constructor(options: { isProduction: boolean; serverKey: string; clientKey: string });
    createTransaction(parameter: SnapTransactionRequest): Promise<SnapTransactionResponse>;
  }
}
