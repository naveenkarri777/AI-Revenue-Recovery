export const CaseStatus = {
  RECOVERED: 'Recovered',
  ACTIVE: 'Active',
  RETRY_SCHEDULED: 'Retry Scheduled',
  ESCALATED: 'Escalated',
  STOPPED: 'Stopped',
  FAILED: 'Failed',
} as const;

export type CaseStatus = (typeof CaseStatus)[keyof typeof CaseStatus];

export const RiskLevel = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
} as const;

export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

export const RootCause = {
  INSUFFICIENT_FUNDS: 'Insufficient Funds',
  EXPIRED_CARD: 'Expired Card',
  NETWORK_ERROR: 'Network Error',
  CARD_DECLINED: 'Card Declined',
  MULTIPLE_FAILED_ATTEMPTS: 'Multiple Failed Attempts',
  B2B_INVOICE_OVERDUE: 'B2B Invoice Overdue',
  BANK_AUTH_FAILED: 'Bank Authorization Failed',
  SUBSCRIPTION_LAPSED: 'Subscription Lapsed',
} as const;

export type RootCause = (typeof RootCause)[keyof typeof RootCause];

export const StrategyType = {
  RETRY_PAYMENT: 'Retry Payment',
  UPDATE_PAYMENT_METHOD: 'Update Payment Method',
  SEND_PAYMENT_LINK: 'Send Payment Link',
  ESCALATE_TO_HUMAN: 'Escalate to Human',
  STOP_AUTOMATION: 'Stop Automation',
  INVOICE_REMINDER: 'Invoice Reminder',
} as const;

export type StrategyType = (typeof StrategyType)[keyof typeof StrategyType];

export const TimelineKind = {
  DETECT: 'detect',
  DIAGNOSE: 'diagnose',
  DECIDE: 'decide',
  VALIDATE: 'validate',
  ACT: 'act',
  RECOVER: 'recover',
  STOP: 'stop',
  ESCALATE: 'escalate',
} as const;

export type TimelineKind = (typeof TimelineKind)[keyof typeof TimelineKind];

export const AuditStatus = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  PENDING: 'pending',
  INFO: 'info',
} as const;

export type AuditStatus = (typeof AuditStatus)[keyof typeof AuditStatus];

export const ActivityCategory = {
  AI_DECISION: 'AI Decision',
  RECOVERY_ACTION: 'Recovery Action',
  SUCCESSFUL: 'Successful',
  FAILED: 'Failed',
  ESCALATED: 'Escalated',
} as const;

export type ActivityCategory = (typeof ActivityCategory)[keyof typeof ActivityCategory];

