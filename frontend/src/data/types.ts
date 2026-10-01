export type CaseStatus =
  | "Recovered"
  | "Active"
  | "Retry Scheduled"
  | "Escalated"
  | "Stopped"
  | "Failed";

export type RiskLevel = "High" | "Medium" | "Low";

export type RootCause =
  | "Insufficient Funds"
  | "Expired Card"
  | "Network Error"
  | "Card Declined"
  | "Multiple Failed Attempts"
  | "B2B Invoice Overdue"
  | "Bank Authorization Failed"
  | "Subscription Lapsed";

export type StrategyType =
  | "Retry Payment"
  | "Update Payment Method"
  | "Send Payment Link"
  | "Escalate to Human"
  | "Stop Automation"
  | "Invoice Reminder";

export interface TimelineEvent {
  timestamp: string; // ISO
  label: string;
  detail: string;
  kind: "detect" | "diagnose" | "decide" | "validate" | "act" | "recover" | "stop" | "escalate";
}

export interface AuditEntry {
  action: string;
  actor: string;
  result: string;
  timestamp: string; // ISO
  status: "success" | "failure" | "pending" | "info";
}

export interface PaymentHistory {
  successfulPayments: number;
  previousFailures: number;
  totalPaid: number;
}

export interface Guardrails {
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

export interface RecoveryCase {
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
  history: PaymentHistory;
  guardrails: Guardrails;
  timeline: TimelineEvent[];
  auditLog: AuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  caseId: string;
  message: string;
  category: "AI Decision" | "Recovery Action" | "Successful" | "Failed" | "Escalated";
  timestamp: string;
  icon: "success" | "retry" | "escalate" | "stop" | "detect";
}

export interface DashboardKpis {
  revenueAtRisk: number;
  revenueAtRiskChange: number;
  revenueRecovered: number;
  recoveryRate: number;
  activeCases: number;
  actionsScheduled: number;
  successfulRecoveries: number;
  successfulRecoveriesChange: number;
}

export interface RevenueTrendPoint {
  day: string;
  atRisk: number;
  recovered: number;
}

export interface RecoveryFunnelStep {
  label: string;
  value: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  trend: RevenueTrendPoint[];
  funnel: RecoveryFunnelStep[];
  recentCases: RecoveryCase[];
}

export interface RecoveryPolicies {
  maxPaymentRetries: number;
  maxCustomerContacts: number;
  maxRecoveryWindowDays: number;
  autoEscalation: boolean;
  highValueThreshold: number;
  aiConfidenceThreshold: number;
}

export interface BatchResult {
  atRisk: number;
  recovered: number;
  rate: number;
  successful: number;
  escalated: number;
  stoppedFailed: number;
  processedCount?: number;
  cases?: RecoveryCase[];
}

export interface StatusStats {
  all: number;
  active: number;
  recovered: number;
  escalated: number;
  stopped: number;
}

export interface PaginatedCasesResult {
  items: RecoveryCase[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats?: StatusStats;
}
