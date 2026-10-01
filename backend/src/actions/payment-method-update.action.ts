import { RecoveryAction, ActionExecutionContext, ActionResult } from './action.interface.js';
import { StrategyType, CaseStatus, TimelineKind, AuditStatus } from '../shared/constants/enums.js';

export class PaymentMethodUpdateAction implements RecoveryAction {
  public readonly actionType = StrategyType.UPDATE_PAYMENT_METHOD;

  async execute(ctx: ActionExecutionContext): Promise<ActionResult> {
    const detail = ctx.strategyDetail || 'Payment link sent for card update';

    return {
      actionType: this.actionType,
      resultingStatus: CaseStatus.ACTIVE,
      amountRecovered: 0,
      retryUsedIncrement: 0,
      contactUsedIncrement: 1,
      nextActionLabel: 'Awaiting customer response to update-payment-method link',
      nextActionAt: null,
      timelineEvents: [
        {
          label: 'Update Payment Method executed',
          detail,
          kind: TimelineKind.ACT,
        },
      ],
      auditEntries: [
        {
          action: 'PAYMENT_METHOD_UPDATE_REQUESTED',
          actor: 'Recovery Agent',
          result: 'Secure update link dispatched to customer',
          status: AuditStatus.PENDING,
        },
      ],
    };
  }
}

