import { RecoveryAction, ActionExecutionContext, ActionResult } from './action.interface.js';
import { StrategyType, CaseStatus, TimelineKind, AuditStatus } from '../shared/constants/enums.js';

export class PaymentRetryAction implements RecoveryAction {
  public readonly actionType = StrategyType.RETRY_PAYMENT;

  async execute(ctx: ActionExecutionContext): Promise<ActionResult> {
    const { caseDoc, paymentProvider, retryAfterHours } = ctx;

    // If future retry is scheduled
    if (retryAfterHours && retryAfterHours > 0) {
      const nextAt = new Date(Date.now() + retryAfterHours * 3600 * 1000);
      return {
        actionType: this.actionType,
        resultingStatus: CaseStatus.RETRY_SCHEDULED,
        amountRecovered: 0,
        retryUsedIncrement: 0,
        contactUsedIncrement: 0,
        nextActionLabel: 'Payment retry scheduled',
        nextActionAt: nextAt,
        timelineEvents: [
          {
            label: 'Recovery action scheduled',
            detail: `Payment retry scheduled in ${retryAfterHours} hours`,
            kind: TimelineKind.ACT,
          },
        ],
        auditEntries: [
          {
            action: 'ACTION_SCHEDULED',
            actor: 'Recovery Agent',
            result: `Payment retry scheduled in ${retryAfterHours}h`,
            status: AuditStatus.PENDING,
          },
        ],
      };
    }

    // Live retry execution
    const paymentResult = await paymentProvider.retryPayment({
      paymentId: caseDoc.paymentId,
      customerId: caseDoc.customerId,
      amount: caseDoc.amountAtRisk,
      paymentMethod: caseDoc.paymentMethod,
    });

    if (paymentResult.success) {
      return {
        actionType: this.actionType,
        resultingStatus: CaseStatus.RECOVERED,
        amountRecovered: caseDoc.amountAtRisk,
        retryUsedIncrement: 1,
        contactUsedIncrement: 0,
        nextActionLabel: null,
        nextActionAt: null,
        timelineEvents: [
          {
            label: 'Retry Payment executed',
            detail: 'Payment retry successfully captured',
            kind: TimelineKind.ACT,
          },
          {
            label: 'Payment successful',
            detail: `₹${caseDoc.amountAtRisk.toLocaleString('en-IN')} recovered`,
            kind: TimelineKind.RECOVER,
          },
        ],
        auditEntries: [
          {
            action: 'PAYMENT_RETRY',
            actor: 'Recovery Agent',
            result: 'Success',
            status: AuditStatus.SUCCESS,
            metadata: { transactionId: paymentResult.transactionId },
          },
          {
            action: 'RECOVERY_COMPLETED',
            actor: 'System',
            result: `₹${caseDoc.amountAtRisk.toLocaleString('en-IN')} recovered`,
            status: AuditStatus.SUCCESS,
          },
        ],
      };
    }

    // Failure case
    const retryMax = caseDoc.guardrails?.retryMax ?? 3;
    const retryUsedAfter = (caseDoc.guardrails?.retryUsed ?? 0) + 1;
    const shouldStop = retryUsedAfter >= retryMax;

    return {
      actionType: this.actionType,
      resultingStatus: shouldStop ? CaseStatus.STOPPED : CaseStatus.FAILED,
      amountRecovered: 0,
      retryUsedIncrement: 1,
      contactUsedIncrement: 0,
      nextActionLabel: shouldStop ? 'Escalate to human review' : 'Retry pending next window',
      nextActionAt: null,
      timelineEvents: [
        {
          label: 'Payment retry failed',
          detail: paymentResult.failureReason || 'Payment gateway declined the retry request',
          kind: shouldStop ? TimelineKind.STOP : TimelineKind.ACT,
        },
      ],
      auditEntries: [
        {
          action: 'PAYMENT_RETRY',
          actor: 'Recovery Agent',
          result: `Failed - ${paymentResult.failureReason || 'Declined'}`,
          status: AuditStatus.FAILURE,
          metadata: { failureReason: paymentResult.failureReason },
        },
      ],
    };
  }
}

