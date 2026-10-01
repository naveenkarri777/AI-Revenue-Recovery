import { RevenueEventRepository, CreateRevenueEventInput } from './revenue-event.repository.js';
import { RecoveryCaseRepository } from '../recovery/recovery-case.repository.js';
import { AuditLogService } from '../audit/audit-log.service.js';
import { PolicySettingsRepository } from '../settings/policy-settings.repository.js';
import { IRevenueEvent } from './revenue-event.model.js';
import { IRecoveryCase } from '../recovery/recovery-case.model.js';
import { generateEventId, generateCaseId, generateCustomerId } from '../../shared/utils/id-generator.js';
import { CaseStatus, RiskLevel, RootCause, StrategyType, TimelineKind, AuditStatus } from '../../shared/constants/enums.js';
import { mapRootCauseToDisplay } from '../../shared/mappers/display.mapper.js';

export interface IngestRevenueEventDto {
  paymentId: string;
  customerId?: string;
  customerName: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  failureReason: string;
  metadata?: Record<string, unknown>;
}

export class RevenueEventService {
  constructor(
    private eventRepo = new RevenueEventRepository(),
    private caseRepo = new RecoveryCaseRepository(),
    private auditService = new AuditLogService(),
    private policyRepo = new PolicySettingsRepository()
  ) {}

  async ingestEvent(input: IngestRevenueEventDto): Promise<{ event: IRevenueEvent; recoveryCase: IRecoveryCase }> {
    const eventId = generateEventId();
    const customerId = input.customerId || generateCustomerId();
    const currency = input.currency || 'INR';

    const eventInput: CreateRevenueEventInput = {
      eventId,
      customerId,
      customerName: input.customerName,
      paymentId: input.paymentId,
      amount: input.amount,
      currency,
      paymentMethod: input.paymentMethod,
      failureReason: input.failureReason,
      metadata: input.metadata,
    };

    const eventDoc = await this.eventRepo.create(eventInput);

    // Check if recovery case exists
    let caseDoc = await this.caseRepo.findByPaymentId(input.paymentId);

    if (!caseDoc) {
      const policies = await this.policyRepo.getSettings();
      const caseId = generateCaseId();
      const rootCause = mapRootCauseToDisplay(input.failureReason);

      // Estimate initial risk
      const risk = input.amount > policies.highValueThreshold ? RiskLevel.HIGH : RiskLevel.MEDIUM;

      caseDoc = await this.caseRepo.create({
        caseId,
        revenueEventId: eventDoc._id.toString(),
        customerId,
        customerName: input.customerName,
        paymentId: input.paymentId,
        paymentMethod: input.paymentMethod,
        amountAtRisk: input.amount,
        amountRecovered: 0,
        status: CaseStatus.ACTIVE,
        risk,
        rootCause,
        strategy: StrategyType.RETRY_PAYMENT,
        strategyDetail: 'Recovery case created and queued for analysis',
        aiConfidence: 80,
        reasoning: 'Initial event registered. Ready for AI agent recovery processing.',
        nextActionLabel: 'Awaiting AI processing',
        nextActionAt: null,
        history: {
          successfulPayments: 10,
          previousFailures: 0,
          totalPaid: input.amount * 10,
        },
        guardrails: {
          retryUsed: 0,
          retryMax: policies.maxPaymentRetries,
          contactUsed: 0,
          contactMax: policies.maxCustomerContacts,
          windowUsedDays: 0,
          windowMaxDays: policies.maxRecoveryWindowDays,
        },
        timeline: [
          {
            timestamp: new Date(),
            label: 'Payment failed',
            detail: `₹${input.amount.toLocaleString('en-IN')} payment failed — Reason: ${rootCause}`,
            kind: TimelineKind.DETECT,
          },
          {
            timestamp: new Date(Date.now() + 1000),
            label: 'Revenue risk detected',
            detail: 'Recovery case created and queued for analysis',
            kind: TimelineKind.DETECT,
          },
        ],
      });

      await this.auditService.record(
        caseId,
        'PAYMENT_FAILED',
        'System',
        'Detected',
        AuditStatus.INFO,
        { paymentId: input.paymentId, amount: input.amount }
      );
    }

    await this.eventRepo.updateStatus(eventId, 'PROCESSED');

    return { event: eventDoc, recoveryCase: caseDoc };
  }

  async getEvents(filter: Record<string, unknown> = {}, skip = 0, limit = 50): Promise<[IRevenueEvent[], number]> {
    return this.eventRepo.list(filter, skip, limit);
  }

  async getEventById(eventId: string): Promise<IRevenueEvent | null> {
    return this.eventRepo.findByEventId(eventId);
  }
}

