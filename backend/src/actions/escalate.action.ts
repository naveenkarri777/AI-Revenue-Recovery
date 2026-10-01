import { RecoveryAction, ActionExecutionContext, ActionResult } from './action.interface.js';
import { StrategyType, CaseStatus, TimelineKind, AuditStatus } from '../shared/constants/enums.js';

export class EscalateAction implements RecoveryAction {
  public readonly actionType = StrategyType.ESCALATE_TO_HUMAN;

  async execute(ctx: ActionExecutionContext): Promise<ActionResult> {
    const detail = ctx.strategyDetail || ctx.reason || 'Routed to revenue-ops queue for manual outreach';

    return {
      actionType: this.actionType,
      resultingStatus: CaseStatus.ESCALATED,
      amountRecovered: 0,
      retryUsedIncrement: 0,
      contactUsedIncrement: 0,
      nextActionLabel: 'Awaiting human review',
      nextActionAt: null,
      timelineEvents: [
        {
          label: 'Escalate to Human executed',
          detail,
          kind: TimelineKind.ACT,
        },
        {
          label: 'Escalated to human review',
          detail: 'Automation confidence below threshold or repeated failures',
          kind: TimelineKind.ESCALATE,
        },
      ],
      auditEntries: [
        {
          action: 'ESCALATION',
          actor: 'Policy Engine',
          result: 'Routed to human review',
          status: AuditStatus.PENDING,
          metadata: { reason: ctx.reason },
        },
      ],
    };
  }
}

