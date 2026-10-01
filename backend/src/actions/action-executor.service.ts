import { RecoveryAction, ActionExecutionContext, ActionResult } from './action.interface.js';
import { StrategyType } from '../shared/constants/enums.js';
import { PaymentRetryAction } from './payment-retry.action.js';
import { PaymentMethodUpdateAction } from './payment-method-update.action.js';
import { SendReminderAction } from './send-reminder.action.js';
import { EscalateAction } from './escalate.action.js';
import { StopAction } from './stop.action.js';
import { BadRequestError } from '../shared/errors/error-types.js';

export class ActionExecutorService {
  private actions: Map<StrategyType, RecoveryAction> = new Map();

  constructor() {
    this.register(new PaymentRetryAction());
    this.register(new PaymentMethodUpdateAction());
    this.register(new SendReminderAction(StrategyType.SEND_PAYMENT_LINK));
    this.register(new SendReminderAction(StrategyType.INVOICE_REMINDER));
    this.register(new EscalateAction());
    this.register(new StopAction());
  }

  register(action: RecoveryAction): void {
    this.actions.set(action.actionType, action);
  }

  async execute(actionType: StrategyType, ctx: ActionExecutionContext): Promise<ActionResult> {
    const action = this.actions.get(actionType);
    if (!action) {
      throw new BadRequestError(`No action executor registered for strategy type: ${actionType}`);
    }

    return action.execute(ctx);
  }
}

