import { CaseStatus, RiskLevel, RootCause, StrategyType, TimelineKind, AuditStatus } from '../constants/enums.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TimelineEventDto {
  timestamp: string; // ISO
  label: string;
  detail: string;
  kind: TimelineKind;
}

export interface AuditEntryDto {
  action: string;
  actor: string;
  result: string;
  timestamp: string; // ISO
  status: AuditStatus;
}

export interface PaymentHistoryDto {
  successfulPayments: number;
  previousFailures: number;
  totalPaid: number;
}

export interface GuardrailsDto {
  retryUsed: number;
  retryMax: number;
  contactUsed: number;
  contactMax: number;
  windowUsedDays: number;
  windowMaxDays: number;
  eligible: boolean;
  withinWindow: boolean;
  actionPermitted: boolean;
}

export interface RecoveryCaseDto {
  id: string;
  customerName: string;
  customerId: string;
  paymentId: string;
  paymentMethod: string;
  amountAtRisk: number;
  amountRecovered: number;
  status: CaseStatus;
  risk: RiskLevel;
  rootCause: RootCause;
  strategy: StrategyType;
  strategyDetail: string;
  aiConfidence: number;
  reasoning: string;
  nextActionLabel: string | null;
  nextActionAt: string | null;
  history: PaymentHistoryDto;
  guardrails: GuardrailsDto;
  timeline: TimelineEventDto[];
  auditLog: AuditEntryDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItemDto {
  id: string;
  caseId: string;
  message: string;
  category: 'AI Decision' | 'Recovery Action' | 'Successful' | 'Failed' | 'Escalated';
  timestamp: string;
  icon: 'success' | 'retry' | 'escalate' | 'stop' | 'detect';
}

export interface DashboardKpisDto {
  revenueAtRisk: number;
  revenueAtRiskChange: number;
  revenueRecovered: number;
  recoveryRate: number;
  activeCases: number;
  actionsScheduled: number;
  successfulRecoveries: number;
  successfulRecoveriesChange: number;
}

export interface RevenueTrendPointDto {
  day: string;
  atRisk: number;
  recovered: number;
}

export interface RecoveryFunnelStepDto {
  label: string;
  value: number;
}

export interface DashboardDataDto {
  kpis: DashboardKpisDto;
  trend: RevenueTrendPointDto[];
  funnel: RecoveryFunnelStepDto[];
  recentCases: RecoveryCaseDto[];
}

export interface BatchSimulationResultDto {
  atRisk: number;
  recovered: number;
  rate: number;
  successful: number;
  escalated: number;
  stoppedFailed: number;
  processedCount: number;
  cases: RecoveryCaseDto[];
}

