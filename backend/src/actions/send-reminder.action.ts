import { RecoveryAction, ActionExecutionContext, ActionResult } from './action.interface.js';
import { StrategyType, CaseStatus, TimelineKind, AuditStatus } from '../shared/constants/enums.js';

export class SendReminderAction implements RecoveryAction {
  public readonly actionType: StrategyType;

  constructor(actionType: StrategyType = StrategyType.SEND_PAYMENT_LINK) {
    this.actionType = actionType;
  }

  async execute(ctx: ActionExecutionContext): Promise<ActionResult> {
    const isInvoice = this.actionType === StrategyType.INVOICE_REMINDER;
    const detail =
      ctx.strategyDetail ||
      (isInvoice
        ? 'Automated reminder sent to accounts-payable contact'
        : 'Payment link reminder dispatched to customer email/SMS');

    return {
      actionType: this.actionType,
      resultingStatus: CaseStatus.ACTIVE,
      amountRecovered: 0,
      retryUsedIncrement: 0,
      contactUsedIncrement: 1,
      nextActionLabel: isInvoice ? 'Awaiting invoice payment' : 'Awaiting payment via sent link',
      nextActionAt: null,
      timelineEvents: [
        {
          label: `${this.actionType} executed`,
          detail,
          kind: TimelineKind.ACT,
        },
      ],
      auditEntries: [
        {
          action: 'REMINDER_SENT',
          actor: 'Recovery Agent',
          result: 'Notification delivered',
          status: AuditStatus.SUCCESS,
        },
      ],
    };
  }
}

