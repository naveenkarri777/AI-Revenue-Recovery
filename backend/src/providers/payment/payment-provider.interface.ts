export interface PaymentRetryInput {
  paymentId: string;
  customerId: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  currency: string;
  failureReason?: string;
  rawResponse?: Record<string, unknown>;
  timestamp: Date;
}

export interface PaymentProvider {
  name: string;
  retryPayment(input: PaymentRetryInput): Promise<PaymentResult>;
  verifyPaymentMethod(paymentMethod: string): Promise<boolean>;
}

