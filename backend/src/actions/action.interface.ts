import { IRecoveryCase } from '../modules/recovery/recovery-case.model.js';
import { StrategyType, CaseStatus, TimelineKind, AuditStatus } from '../shared/constants/enums.js';
import { PaymentProvider } from '../providers/payment/payment-provider.interface.js';

export interface ActionExecutionContext {
  caseDoc: IRecoveryCase;
  paymentProvider: PaymentProvider;
  retryAfterHours?: number | null;
  reason?: string;
  strategyDetail?: string;
}

export interface ActionResult {
  actionType: StrategyType;
  resultingStatus: CaseStatus;
  amountRecovered: number;
  retryUsedIncrement: number;
  contactUsedIncrement: number;
  nextActionLabel: string | null;
  nextActionAt: Date | null;
  timelineEvents: Array<{
    label: string;
    detail: string;
    kind: TimelineKind;
    timestamp?: Date;
  }>;
  auditEntries: Array<{
    action: string;
    actor: string;
    result: string;
    status: AuditStatus;
    metadata?: Record<string, unknown>;
  }>;
}

export interface RecoveryAction {
  actionType: StrategyType;
  execute(ctx: ActionExecutionContext): Promise<ActionResult>;
}

