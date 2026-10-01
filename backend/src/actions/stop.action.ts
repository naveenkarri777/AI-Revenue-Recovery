import { RecoveryAction, ActionExecutionContext, ActionResult } from './action.interface.js';
import { StrategyType, CaseStatus, TimelineKind, AuditStatus } from '../shared/constants/enums.js';

export class StopAction implements RecoveryAction {
  public readonly actionType = StrategyType.STOP_AUTOMATION;

  async execute(ctx: ActionExecutionContext): Promise<ActionResult> {
    const detail =
      ctx.strategyDetail ||
      'Maximum retry attempts reached — automation halted per guardrail policy';

    return {
      actionType: this.actionType,
      resultingStatus: CaseStatus.STOPPED,
      amountRecovered: 0,
      retryUsedIncrement: 0,
      contactUsedIncrement: 0,
      nextActionLabel: 'Escalate to human review',
      nextActionAt: null,
      timelineEvents: [
        {
          label: 'Automation stopped',
          detail,
          kind: TimelineKind.STOP,
        },
      ],
      auditEntries: [
        {
          action: 'RETRY_LIMIT_CHECK',
          actor: 'Policy Engine',
          result: 'Limit reached',
          status: AuditStatus.FAILURE,
        },
        {
          action: 'AUTOMATION_STOPPED',
          actor: 'System',
          result: 'Escalation required',
          status: AuditStatus.PENDING,
          metadata: { reason: ctx.reason },
        },
      ],
    };
  }
}

