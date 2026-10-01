import type {
  RecoveryCase,
  ActivityItem,
  CaseStatus,
  RiskLevel,
  RootCause,
  StrategyType,
  TimelineEvent,
  AuditEntry,
} from "./types";

// Anchor "now" to the in-story present so relative times read naturally.
export const NOW = new Date("2026-08-23T10:52:00");

function minsAgo(mins: number): string {
  return new Date(NOW.getTime() - mins * 60_000).toISOString();
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export { fmtTime, fmtDateTime };

interface CaseSeed {
  id: string;
  customerName: string;
  amountAtRisk: number;
  amountRecovered: number;
  status: CaseStatus;
  risk: RiskLevel;
  rootCause: RootCause;
  strategy: StrategyType;
  strategyDetail: string;
  paymentMethod: string;
  aiConfidence: number;
  reasoning: string;
  createdMinsAgo: number;
  updatedMinsAgo: number;
  retryUsed: number;
  retryMax: number;
  contactUsed: number;
  contactMax: number;
  windowUsedDays: number;
  windowMaxDays: number;
  successfulPayments: number;
  previousFailures: number;
  totalPaid: number;
  nextActionLabel: string | null;
  nextActionInMins: number | null;
}

function buildTimeline(seed: CaseSeed): TimelineEvent[] {
  const created = NOW.getTime() - seed.createdMinsAgo * 60_000;
  const t = (offsetMin: number) => new Date(created + offsetMin * 60_000).toISOString();

  const events: TimelineEvent[] = [
    {
      timestamp: t(0),
      label: `Payment failed`,
      detail: `\u20b9${seed.amountAtRisk.toLocaleString("en-IN")} payment failed \u2014 Reason: ${seed.rootCause}`,
      kind: "detect",
    },
    {
      timestamp: t(1),
      label: "Revenue risk detected",
      detail: "Recovery case created and queued for analysis",
      kind: "detect",
    },
    {
      timestamp: t(2),
      label: "AI analysis completed",
      detail: `Confidence: ${seed.aiConfidence}%`,
      kind: "diagnose",
    },
    {
      timestamp: t(3),
      label: "Recovery strategy selected",
      detail: seed.strategyDetail,
      kind: "decide",
    },
    {
      timestamp: t(3),
      label: "Policy validation passed",
      detail: "Guardrail checks cleared \u2014 action permitted",
      kind: "validate",
    },
  ];

  if (seed.status === "Recovered") {
    events.push(
      {
        timestamp: t(seed.updatedMinsAgo ? seed.createdMinsAgo - seed.updatedMinsAgo - 1 : 20),
        label: `${seed.strategy} executed`,
        detail: seed.strategyDetail,
        kind: "act",
      },
      {
        timestamp: t(seed.createdMinsAgo - seed.updatedMinsAgo),
        label: "Payment successful",
        detail: `\u20b9${seed.amountRecovered.toLocaleString("en-IN")} recovered`,
        kind: "recover",
      }
    );
  } else if (seed.status === "Retry Scheduled" || seed.status === "Active") {
    events.push({
      timestamp: t(4),
      label: "Recovery action scheduled",
      detail: seed.nextActionLabel ?? "Next action pending",
      kind: "act",
    });
  } else if (seed.status === "Escalated") {
    events.push(
      {
        timestamp: t(4),
        label: `${seed.strategy} executed`,
        detail: seed.strategyDetail,
        kind: "act",
      },
      {
        timestamp: t(5),
        label: "Escalated to human review",
        detail: "Automation confidence below threshold or repeated failures",
        kind: "escalate",
      }
    );
  } else if (seed.status === "Stopped") {
    events.push({
      timestamp: t(4),
      label: "Automation stopped",
      detail: "Maximum retry attempts reached \u2014 guardrail limit enforced",
      kind: "stop",
    });
  } else if (seed.status === "Failed") {
    events.push({
      timestamp: t(4),
      label: "Recovery action failed",
      detail: seed.strategyDetail,
      kind: "stop",
    });
  }

  return events;
}

function buildAudit(seed: CaseSeed): AuditEntry[] {
  const created = NOW.getTime() - seed.createdMinsAgo * 60_000;
  const t = (offsetMin: number) => new Date(created + offsetMin * 60_000).toISOString();

  const entries: AuditEntry[] = [
    { action: "PAYMENT_FAILED", actor: "System", result: "Detected", timestamp: t(0), status: "info" },
    { action: "AI_ANALYSIS", actor: "AI Agent", result: "Completed", timestamp: t(2), status: "success" },
    { action: "POLICY_CHECK", actor: "Policy Engine", result: "Approved", timestamp: t(3), status: "success" },
  ];

  if (seed.status === "Recovered") {
    entries.push(
      { action: "PAYMENT_RETRY", actor: "Recovery Agent", result: "Success", timestamp: t(20), status: "success" },
      { action: "RECOVERY_COMPLETED", actor: "System", result: `\u20b9${seed.amountRecovered.toLocaleString("en-IN")} recovered`, timestamp: t(21), status: "success" }
    );
  } else if (seed.status === "Escalated") {
    entries.push(
      { action: "PAYMENT_RETRY", actor: "Recovery Agent", result: "Failed", timestamp: t(4), status: "failure" },
      { action: "ESCALATION", actor: "Policy Engine", result: "Routed to human review", timestamp: t(5), status: "pending" }
    );
  } else if (seed.status === "Stopped") {
    entries.push(
      { action: "RETRY_LIMIT_CHECK", actor: "Policy Engine", result: "Limit reached", timestamp: t(4), status: "failure" },
      { action: "AUTOMATION_STOPPED", actor: "System", result: "Escalation required", timestamp: t(5), status: "pending" }
    );
  } else if (seed.status === "Retry Scheduled" || seed.status === "Active") {
    entries.push({
      action: "ACTION_SCHEDULED",
      actor: "Recovery Agent",
      result: seed.nextActionLabel ?? "Scheduled",
      timestamp: t(4),
      status: "pending",
    });
  } else if (seed.status === "Failed") {
    entries.push({ action: "PAYMENT_RETRY", actor: "Recovery Agent", result: "Failed", timestamp: t(4), status: "failure" });
  }

  return entries;
}

function toCase(seed: CaseSeed): RecoveryCase {
  const createdAt = minsAgo(seed.createdMinsAgo);
  const updatedAt = minsAgo(seed.updatedMinsAgo);
  const nextActionAt =
    seed.nextActionInMins != null ? new Date(NOW.getTime() + seed.nextActionInMins * 60_000).toISOString() : null;

  return {
    id: seed.id,
    customerName: seed.customerName,
    customerId: `CUS-${10000 + hashId(seed.id)}`,
    paymentId: `PAY-${80000 + hashId(seed.id)}`,
    paymentMethod: seed.paymentMethod,
    amountAtRisk: seed.amountAtRisk,
    amountRecovered: seed.amountRecovered,
    status: seed.status,
    risk: seed.risk,
    rootCause: seed.rootCause,
    strategy: seed.strategy,
    strategyDetail: seed.strategyDetail,
    aiConfidence: seed.aiConfidence,
    reasoning: seed.reasoning,
    nextActionLabel: seed.nextActionLabel,
    nextActionAt,
    history: {
      successfulPayments: seed.successfulPayments,
      previousFailures: seed.previousFailures,
      totalPaid: seed.totalPaid,
    },
    guardrails: {
      retryUsed: seed.retryUsed,
      retryMax: seed.retryMax,
      contactUsed: seed.contactUsed,
      contactMax: seed.contactMax,
      windowUsedDays: seed.windowUsedDays,
      windowMaxDays: seed.windowMaxDays,
      eligible: seed.status !== "Stopped",
      withinWindow: seed.windowUsedDays <= seed.windowMaxDays,
      actionPermitted: seed.status !== "Stopped",
    },
    timeline: buildTimeline(seed),
    auditLog: buildAudit(seed),
    createdAt,
    updatedAt,
  };
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9000;
  return h;
}

const seeds: CaseSeed[] = [
  {
    id: "RC-1024",
    customerName: "Rahul Kumar",
    amountAtRisk: 2000,
    amountRecovered: 2000,
    status: "Recovered",
    risk: "High",
    rootCause: "Insufficient Funds",
    strategy: "Retry Payment",
    strategyDetail: "Retry payment after 24 hours",
    paymentMethod: "Visa \u2022\u2022\u2022\u2022 4242",
    aiConfidence: 92,
    reasoning:
      "The customer has a strong historical payment record. The current failure appears temporary rather than a permanent payment-method issue.",
    createdMinsAgo: 1442,
    updatedMinsAgo: 2,
    retryUsed: 1,
    retryMax: 3,
    contactUsed: 0,
    contactMax: 2,
    windowUsedDays: 2,
    windowMaxDays: 7,
    successfulPayments: 14,
    previousFailures: 1,
    totalPaid: 28000,
    nextActionLabel: null,
    nextActionInMins: null,
  },
  {
    id: "RC-1025",
    customerName: "Priya Sharma",
    amountAtRisk: 5000,
    amountRecovered: 0,
    status: "Retry Scheduled",
    risk: "Medium",
    rootCause: "Network Error",
    strategy: "Retry Payment",
    strategyDetail: "Retry payment after 6 hours \u2014 likely transient gateway failure",
    paymentMethod: "Mastercard \u2022\u2022\u2022\u2022 8810",
    aiConfidence: 88,
    reasoning:
      "Payment failure matches a known gateway timeout signature rather than a customer-side issue. No action needed from the customer.",
    createdMinsAgo: 8,
    updatedMinsAgo: 8,
    retryUsed: 0,
    retryMax: 3,
    contactUsed: 0,
    contactMax: 2,
    windowUsedDays: 0,
    windowMaxDays: 7,
    successfulPayments: 22,
    previousFailures: 0,
    totalPaid: 44000,
    nextActionLabel: "Payment retry scheduled",
    nextActionInMins: 360,
  },
  {
    id: "RC-1026",
    customerName: "Ananya Textiles Pvt Ltd",
    amountAtRisk: 8000,
    amountRecovered: 0,
    status: "Active",
    risk: "Medium",
    rootCause: "Expired Card",
    strategy: "Update Payment Method",
    strategyDetail: "Payment link sent for card update",
    paymentMethod: "RuPay \u2022\u2022\u2022\u2022 2211 (expired)",
    aiConfidence: 81,
    reasoning:
      "Card on file expired last billing cycle. Retrying will not succeed \u2014 customer must update the payment method before the subscription can resume.",
    createdMinsAgo: 40,
    updatedMinsAgo: 12,
    retryUsed: 0,
    retryMax: 3,
    contactUsed: 1,
    contactMax: 2,
    windowUsedDays: 0,
    windowMaxDays: 7,
    successfulPayments: 9,
    previousFailures: 1,
    totalPaid: 72000,
    nextActionLabel: "Awaiting customer response to update-payment-method link",
    nextActionInMins: null,
  },
  {
    id: "RC-1027",
    customerName: "Vikram Malhotra",
    amountAtRisk: 15000,
    amountRecovered: 0,
    status: "Escalated",
    risk: "High",
    rootCause: "Multiple Failed Attempts",
    strategy: "Escalate to Human",
    strategyDetail: "Routed to revenue-ops queue for manual outreach",
    paymentMethod: "Visa \u2022\u2022\u2022\u2022 5567",
    aiConfidence: 64,
    reasoning:
      "Three consecutive retries have failed across two payment methods. Confidence in automated recovery has dropped below the action threshold.",
    createdMinsAgo: 15,
    updatedMinsAgo: 15,
    retryUsed: 3,
    retryMax: 3,
    contactUsed: 1,
    contactMax: 2,
    windowUsedDays: 3,
    windowMaxDays: 7,
    successfulPayments: 6,
    previousFailures: 3,
    totalPaid: 90000,
    nextActionLabel: "Awaiting human review",
    nextActionInMins: null,
  },
  {
    id: "RC-1028",
    customerName: "Suresh Patel",
    amountAtRisk: 3500,
    amountRecovered: 0,
    status: "Stopped",
    risk: "Medium",
    rootCause: "Insufficient Funds",
    strategy: "Stop Automation",
    strategyDetail: "Maximum retry attempts reached \u2014 automation halted per guardrail policy",
    paymentMethod: "Visa \u2022\u2022\u2022\u2022 1190",
    aiConfidence: 55,
    reasoning:
      "Retry limit of 3 attempts reached without success. Continuing would violate the recovery policy. Escalating to human review is the next step.",
    createdMinsAgo: 21,
    updatedMinsAgo: 21,
    retryUsed: 3,
    retryMax: 3,
    contactUsed: 2,
    contactMax: 2,
    windowUsedDays: 7,
    windowMaxDays: 7,
    successfulPayments: 4,
    previousFailures: 4,
    totalPaid: 16000,
    nextActionLabel: "Escalate to human review",
    nextActionInMins: null,
  },
  {
    id: "RC-1029",
    customerName: "Meridian Logistics",
    amountAtRisk: 50000,
    amountRecovered: 0,
    status: "Escalated",
    risk: "High",
    rootCause: "B2B Invoice Overdue",
    strategy: "Escalate to Human",
    strategyDetail: "High-value invoice routed for account-manager review (above \u20b925,000 threshold)",
    paymentMethod: "Bank Transfer (NEFT)",
    aiConfidence: 70,
    reasoning:
      "Invoice value exceeds the auto-approval threshold. Per policy, high-value B2B recoveries require human sign-off before contact.",
    createdMinsAgo: 190,
    updatedMinsAgo: 55,
    retryUsed: 0,
    retryMax: 2,
    contactUsed: 0,
    contactMax: 2,
    windowUsedDays: 4,
    windowMaxDays: 14,
    successfulPayments: 31,
    previousFailures: 2,
    totalPaid: 640000,
    nextActionLabel: "Awaiting account manager review",
    nextActionInMins: null,
  },
];

// Extra synthetic cases to give tables/pages enough volume.
const extraNames = [
  "Neha Reddy", "Arjun Verma", "Kavita Iyer", "Rohan Desai", "Sanjana Rao",
  "Aditya Nair", "Ishita Bose", "Karan Chopra", "Meera Pillai", "Vivek Menon",
  "Divya Krishnan", "Siddharth Joshi", "Pooja Agarwal", "Amitabh Ghosh", "Nandini Rao",
  "Tarun Kapoor", "Shreya Bhatt", "Rajesh Khanna", "Lakshmi Venkatesh", "Manish Tiwari",
  "Bluewave Apparel", "Sundar Traders", "Orchid Interiors", "Kestrel Freight Co",
];
const rootCauses: RootCause[] = [
  "Insufficient Funds", "Expired Card", "Network Error", "Card Declined",
  "Multiple Failed Attempts", "Bank Authorization Failed", "Subscription Lapsed",
];
const paymentMethods = [
  "Visa \u2022\u2022\u2022\u2022 4118", "Mastercard \u2022\u2022\u2022\u2022 7723", "RuPay \u2022\u2022\u2022\u2022 3390",
  "UPI \u2022\u2022\u2022\u2022@okhdfc", "Bank Transfer (NEFT)", "Amex \u2022\u2022\u2022\u2022 1004",
];
const statusPool: CaseStatus[] = [
  "Recovered", "Recovered", "Recovered", "Active", "Retry Scheduled",
  "Retry Scheduled", "Escalated", "Stopped", "Failed", "Recovered",
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function strategyFor(status: CaseStatus, cause: RootCause): { strategy: StrategyType; detail: string } {
  if (status === "Stopped") return { strategy: "Stop Automation", detail: "Maximum retry attempts reached \u2014 automation halted per guardrail policy" };
  if (status === "Escalated") return { strategy: "Escalate to Human", detail: "Routed to revenue-ops queue for manual outreach" };
  if (cause === "Expired Card") return { strategy: "Update Payment Method", detail: "Payment link sent for card update" };
  if (cause === "B2B Invoice Overdue") return { strategy: "Invoice Reminder", detail: "Automated reminder sent to accounts-payable contact" };
  return { strategy: "Retry Payment", detail: "Retry payment after 24 hours" };
}

const extraSeeds: CaseSeed[] = extraNames.map((name, i) => {
  const id = `RC-${1030 + i}`;
  const status = pick(statusPool, i + 3);
  const cause = pick(rootCauses, i + 1);
  const { strategy, detail } = strategyFor(status, cause);
  const risk: RiskLevel = i % 3 === 0 ? "High" : i % 3 === 1 ? "Medium" : "Low";
  const amount = [1500, 2200, 3200, 4800, 6000, 7500, 9200, 12000, 18500, 24000][i % 10];
  const recovered = status === "Recovered" ? amount : 0;
  const createdMinsAgo = 30 + i * 47;
  const updatedMinsAgo = status === "Recovered" ? Math.max(2, createdMinsAgo - 60 - i * 3) : Math.max(1, createdMinsAgo - i);
  const confidence = status === "Recovered" ? 84 + (i % 12) : status === "Escalated" || status === "Stopped" ? 48 + (i % 15) : 70 + (i % 20);

  return {
    id,
    customerName: name,
    amountAtRisk: amount,
    amountRecovered: recovered,
    status,
    risk,
    rootCause: cause,
    strategy,
    strategyDetail: detail,
    paymentMethod: pick(paymentMethods, i),
    aiConfidence: confidence,
    reasoning:
      status === "Recovered"
        ? "Customer payment history supports automated retry. No escalation required."
        : status === "Escalated" || status === "Stopped"
        ? "Repeated failures or policy limits mean automated recovery is no longer appropriate without human review."
        : "Failure pattern matches a recoverable case. Recovery action scheduled per standard policy.",
    createdMinsAgo,
    updatedMinsAgo,
    retryUsed: status === "Stopped" ? 3 : status === "Recovered" ? 1 : status === "Escalated" ? 2 : 0,
    retryMax: 3,
    contactUsed: status === "Stopped" ? 2 : i % 2,
    contactMax: 2,
    windowUsedDays: Math.min(7, Math.floor(createdMinsAgo / 1440) + 1),
    windowMaxDays: 7,
    successfulPayments: 4 + (i % 20),
    previousFailures: i % 4,
    totalPaid: 10000 + i * 3200,
    nextActionLabel:
      status === "Retry Scheduled" ? "Payment retry scheduled" : status === "Active" ? "Awaiting customer action" : null,
    nextActionInMins: status === "Retry Scheduled" ? 120 + i * 30 : null,
  };
});

export const recoveryCases: RecoveryCase[] = [...seeds, ...extraSeeds].map(toCase);

export function getCaseById(id: string): RecoveryCase | undefined {
  return recoveryCases.find((c) => c.id === id);
}

// ---- Activity feed ----
export const activityFeed: ActivityItem[] = [
  { id: "a1", caseId: "RC-1024", message: "\u20b92,000 recovered", category: "Successful", timestamp: minsAgo(2), icon: "success" },
  { id: "a2", caseId: "RC-1025", message: "Payment retry scheduled", category: "Recovery Action", timestamp: minsAgo(8), icon: "retry" },
  { id: "a3", caseId: "RC-1027", message: "Case escalated to human review", category: "Escalated", timestamp: minsAgo(15), icon: "escalate" },
  { id: "a4", caseId: "RC-1028", message: "Recovery stopped \u2014 retry limit reached", category: "Failed", timestamp: minsAgo(21), icon: "stop" },
  { id: "a5", caseId: "RC-1026", message: "AI selected Update Payment Method strategy", category: "AI Decision", timestamp: minsAgo(28), icon: "detect" },
  { id: "a6", caseId: "RC-1031", message: "\u20b92,200 recovered", category: "Successful", timestamp: minsAgo(77), icon: "success" },
  { id: "a7", caseId: "RC-1029", message: "High-value invoice escalated for review", category: "Escalated", timestamp: minsAgo(55), icon: "escalate" },
  { id: "a8", caseId: "RC-1033", message: "Payment retry scheduled", category: "Recovery Action", timestamp: minsAgo(130), icon: "retry" },
  { id: "a9", caseId: "RC-1035", message: "\u20b96,000 recovered", category: "Successful", timestamp: minsAgo(210), icon: "success" },
  { id: "a10", caseId: "RC-1038", message: "Recovery stopped \u2014 retry limit reached", category: "Failed", timestamp: minsAgo(340), icon: "stop" },
  { id: "a11", caseId: "RC-1024", message: "AI analysis completed \u2014 confidence 92%", category: "AI Decision", timestamp: minsAgo(1441), icon: "detect" },
  { id: "a12", caseId: "RC-1040", message: "\u20b924,000 recovered", category: "Successful", timestamp: minsAgo(420), icon: "success" },
];

// ---- Chart data: revenue at risk vs recovered, last 7 days ----
export const revenueTrend = [
  { day: "Mon", atRisk: 6200, recovered: 3800 },
  { day: "Tue", atRisk: 7100, recovered: 4600 },
  { day: "Wed", atRisk: 5800, recovered: 4100 },
  { day: "Thu", atRisk: 8300, recovered: 5200 },
  { day: "Fri", atRisk: 9100, recovered: 5900 },
  { day: "Sat", atRisk: 6600, recovered: 4300 },
  { day: "Sun", atRisk: 5400, recovered: 3300 },
];

export const dashboardKpis = {
  revenueAtRisk: 48500,
  revenueAtRiskChange: 12.4,
  revenueRecovered: 31200,
  recoveryRate: 64.3,
  activeCases: 18,
  actionsScheduled: 7,
  successfulRecoveries: 12,
  successfulRecoveriesChange: 18.2,
};

export const recoveryFunnel = [
  { label: "Revenue at Risk", value: 48500 },
  { label: "AI Analyzed", value: 48500 },
  { label: "Recovery Actions", value: 42000 },
  { label: "Successfully Recovered", value: 31200 },
];

export const recoveryPolicies = {
  maxPaymentRetries: 3,
  maxCustomerContacts: 2,
  maxRecoveryWindowDays: 7,
  autoEscalation: true,
  highValueThreshold: 25000,
  aiConfidenceThreshold: 80,
};
