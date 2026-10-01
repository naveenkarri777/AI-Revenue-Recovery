import { RevenueEventService } from '../revenue-events/revenue-event.service.js';
import { RecoveryService } from '../recovery/recovery.service.js';
import { BatchSimulationResultDto, RecoveryCaseDto } from '../../shared/types/api.types.js';
import { CaseStatus } from '../../shared/constants/enums.js';

const DEMO_CUSTOMERS = [
  { name: 'Kavita Iyer', amount: 2000, reason: 'Insufficient funds in account', method: 'Visa •••• 4242' },
  { name: 'Rohan Desai', amount: 5000, reason: 'Network timeout during capture', method: 'Mastercard •••• 8810' },
  { name: 'Orchid Interiors', amount: 8000, reason: 'Card has expired', method: 'RuPay •••• 2211 (expired)' },
  { name: 'Arjun Verma', amount: 15000, reason: 'Multiple failed retries', method: 'Visa •••• 5567' },
  { name: 'Sanjana Rao', amount: 3500, reason: 'Card declined by issuer', method: 'Visa •••• 1190' },
  { name: 'Sundar Traders', amount: 50000, reason: 'B2B Invoice Overdue', method: 'Bank Transfer (NEFT)' },
  { name: 'Aditya Nair', amount: 1200, reason: 'Transient gateway error', method: 'UPI ••••@okhdfc' },
  { name: 'Ishita Bose', amount: 4500, reason: 'Insufficient funds in account', method: 'Mastercard •••• 3341' },
  { name: 'Karan Chopra', amount: 2500, reason: 'Card expired last month', method: 'Visa •••• 9920 (expired)' },
  { name: 'Meera Pillai', amount: 6200, reason: 'Network error', method: 'RuPay •••• 5512' },
  { name: 'Vivek Menon', amount: 18000, reason: 'Repeated bank decline', method: 'Amex •••• 1004' },
  { name: 'Divya Krishnan', amount: 3100, reason: 'Insufficient balance', method: 'Visa •••• 7731' },
  { name: 'Siddharth Joshi', amount: 4900, reason: 'Bank Authorization Failed', method: 'Mastercard •••• 6612' },
  { name: 'Pooja Agarwal', amount: 7200, reason: 'Insufficient funds in account', method: 'UPI ••••@icici' },
  { name: 'Amitabh Ghosh', amount: 12500, reason: 'Subscription renewal lapsed', method: 'Visa •••• 3419' },
  { name: 'Nandini Rao', amount: 2200, reason: 'Network timeout', method: 'Mastercard •••• 9012' },
  { name: 'Tarun Kapoor', amount: 16000, reason: 'Card declined by issuing bank', method: 'Visa •••• 4118' },
  { name: 'Shreya Bhatt', amount: 3800, reason: 'Temporary insufficient funds', method: 'RuPay •••• 3390' },
  { name: 'Rajesh Khanna', amount: 9500, reason: 'Payment gateway timeout', method: 'Visa •••• 1209' },
  { name: 'Lakshmi Venkatesh', amount: 4000, reason: 'Insufficient funds in account', method: 'Mastercard •••• 8119' },
];

export class DemoService {
  constructor(
    private eventService = new RevenueEventService(),
    private recoveryService = new RecoveryService()
  ) {}

  async runBatchSimulation(batchSize = 20): Promise<BatchSimulationResultDto> {
    const pool = DEMO_CUSTOMERS.slice(0, batchSize);
    const processedCases: RecoveryCaseDto[] = [];

    let totalAtRisk = 0;
    let totalRecovered = 0;
    let successful = 0;
    let escalated = 0;
    let stoppedFailed = 0;

    for (let i = 0; i < pool.length; i++) {
      const item = pool[i];
      const paymentId = `PAY-SIM-${Date.now().toString().slice(-4)}${i + 100}`;

      // 1. Ingest event and create recovery case
      const { recoveryCase } = await this.eventService.ingestEvent({
        customerName: item.name,
        amount: item.amount,
        paymentId,
        paymentMethod: item.method,
        failureReason: item.reason,
      });

      // 2. Process case through the recovery pipeline
      const processed = await this.recoveryService.processCase(recoveryCase.caseId);
      processedCases.push(processed);

      totalAtRisk += processed.amountAtRisk;
      totalRecovered += processed.amountRecovered;

      if (processed.status === CaseStatus.RECOVERED) {
        successful++;
      } else if (processed.status === CaseStatus.ESCALATED) {
        escalated++;
      } else if (processed.status === CaseStatus.STOPPED || processed.status === CaseStatus.FAILED) {
        stoppedFailed++;
      }
    }

    const rate = totalAtRisk > 0 ? Math.round((totalRecovered / totalAtRisk) * 100) : 0;

    return {
      atRisk: totalAtRisk,
      recovered: totalRecovered,
      rate,
      successful,
      escalated,
      stoppedFailed,
      processedCount: processedCases.length,
      cases: processedCases,
    };
  }
}

