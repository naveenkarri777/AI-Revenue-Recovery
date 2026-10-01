import { PaymentProvider, PaymentRetryInput, PaymentResult } from './payment-provider.interface.js';
import { nanoid } from 'nanoid';

export class PaymentSimulatorProvider implements PaymentProvider {
  public readonly name = 'PaymentSimulator';

  async retryPayment(input: PaymentRetryInput): Promise<PaymentResult> {
    // Artificial small delay for realism
    await new Promise((resolve) => setTimeout(resolve, 50));

    const isExpiredCard = input.paymentMethod?.toLowerCase().includes('expired');
    const isHardDeclined = input.paymentMethod?.toLowerCase().includes('declined');

    let success = true;
    let failureReason: string | undefined = undefined;

    if (isExpiredCard) {
      success = false;
      failureReason = 'Card has expired';
    } else if (isHardDeclined) {
      success = false;
      failureReason = 'Card permanently declined by issuing bank';
    } else {
      // 85% success probability for simulation
      const randomSuccess = Math.random() < 0.85;
      if (!randomSuccess) {
        success = false;
        failureReason = 'Temporary gateway timeout on retry';
      }
    }

    return {
      success,
      transactionId: `TXN-${nanoid(10).toUpperCase()}`,
      amount: input.amount,
      currency: input.currency || 'INR',
      failureReason,
      timestamp: new Date(),
      rawResponse: {
        provider: 'Simulator',
        status: success ? 'CAPTURED' : 'FAILED',
        networkStatusCode: success ? '00' : '05',
      },
    };
  }

  async verifyPaymentMethod(paymentMethod: string): Promise<boolean> {
    return !paymentMethod.toLowerCase().includes('expired');
  }
}

