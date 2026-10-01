import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { RecoveryCaseModel } from '../modules/recovery/recovery-case.model.js';
import { RevenueEventModel } from '../modules/revenue-events/revenue-event.model.js';
import { AuditLogModel } from '../modules/audit/audit-log.model.js';
import { PolicySettingsModel } from '../modules/settings/policy-settings.model.js';
import { CaseStatus, RiskLevel, RootCause, StrategyType, TimelineKind, AuditStatus } from '../shared/constants/enums.js';
import { generateAuditId, generateEventId, generateCustomerId, generatePaymentId } from '../shared/utils/id-generator.js';

const NOW = new Date('2026-08-23T10:52:00');

function minsAgo(mins: number): Date {
  return new Date(NOW.getTime() - mins * 60_000);
}

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

const baseSeeds: CaseSeed[] = [
  {
    id: 'RC-1024',
    customerName: 'Rahul Kumar',
    amountAtRisk: 2000,
    amountRecovered: 2000,
    status: CaseStatus.RECOVERED,
    risk: RiskLevel.HIGH,
    rootCause: RootCause.INSUFFICIENT_FUNDS,
    strategy: StrategyType.RETRY_PAYMENT,
    strategyDetail: 'Retry payment after 24 hours',
    paymentMethod: 'Visa •••• 4242',
    aiConfidence: 92,
    reasoning: 'The customer has a strong historical payment record. The current failure appears temporary rather than a permanent payment-method issue.',
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
    id: 'RC-1025',
    customerName: 'Priya Sharma',
    amountAtRisk: 5000,
    amountRecovered: 0,
    status: CaseStatus.RETRY_SCHEDULED,
    risk: RiskLevel.MEDIUM,
    rootCause: RootCause.NETWORK_ERROR,
    strategy: StrategyType.RETRY_PAYMENT,
    strategyDetail: 'Retry payment after 6 hours — likely transient gateway failure',
    paymentMethod: 'Mastercard •••• 8810',
    aiConfidence: 88,
    reasoning: 'Payment failure matches a known gateway timeout signature rather than a customer-side issue. No action needed from the customer.',
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
    nextActionLabel: 'Payment retry scheduled',
    nextActionInMins: 360,
  },
  {
    id: 'RC-1026',
    customerName: 'Ananya Textiles Pvt Ltd',
    amountAtRisk: 8000,
    amountRecovered: 0,
    status: CaseStatus.ACTIVE,
    risk: RiskLevel.MEDIUM,
    rootCause: RootCause.EXPIRED_CARD,
    strategy: StrategyType.UPDATE_PAYMENT_METHOD,
    strategyDetail: 'Payment link sent for card update',
    paymentMethod: 'RuPay •••• 2211 (expired)',
    aiConfidence: 81,
    reasoning: 'Card on file expired last billing cycle. Retrying will not succeed — customer must update the payment method before the subscription can resume.',
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
    nextActionLabel: 'Awaiting customer response to update-payment-method link',
    nextActionInMins: null,
  },
  {
    id: 'RC-1027',
    customerName: 'Vikram Malhotra',
    amountAtRisk: 15000,
    amountRecovered: 0,
    status: CaseStatus.ESCALATED,
    risk: RiskLevel.HIGH,
    rootCause: RootCause.MULTIPLE_FAILED_ATTEMPTS,
    strategy: StrategyType.ESCALATE_TO_HUMAN,
    strategyDetail: 'Routed to revenue-ops queue for manual outreach',
    paymentMethod: 'Visa •••• 5567',
    aiConfidence: 64,
    reasoning: 'Three consecutive retries have failed across two payment methods. Confidence in automated recovery has dropped below the action threshold.',
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
    nextActionLabel: 'Awaiting human review',
    nextActionInMins: null,
  },
  {
    id: 'RC-1028',
    customerName: 'Suresh Patel',
    amountAtRisk: 3500,
    amountRecovered: 0,
    status: CaseStatus.STOPPED,
    risk: RiskLevel.MEDIUM,
    rootCause: RootCause.INSUFFICIENT_FUNDS,
    strategy: StrategyType.STOP_AUTOMATION,
    strategyDetail: 'Maximum retry attempts reached — automation halted per guardrail policy',
    paymentMethod: 'Visa •••• 1190',
    aiConfidence: 55,
    reasoning: 'Retry limit of 3 attempts reached without success. Continuing would violate the recovery policy. Escalating to human review is the next step.',
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
    nextActionLabel: 'Escalate to human review',
    nextActionInMins: null,
  },
  {
    id: 'RC-1029',
    customerName: 'Meridian Logistics',
    amountAtRisk: 50000,
    amountRecovered: 0,
    status: CaseStatus.ESCALATED,
    risk: RiskLevel.HIGH,
    rootCause: RootCause.B2B_INVOICE_OVERDUE,
    strategy: StrategyType.ESCALATE_TO_HUMAN,
    strategyDetail: 'High-value invoice routed for account-manager review (above ₹25,000 threshold)',
    paymentMethod: 'Bank Transfer (NEFT)',
    aiConfidence: 70,
    reasoning: 'Invoice value exceeds the auto-approval threshold. Per policy, high-value B2B recoveries require human sign-off before contact.',
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
    nextActionLabel: 'Awaiting account manager review',
    nextActionInMins: null,
  },
];

const extraNames = [
  'Neha Reddy', 'Arjun Verma', 'Kavita Iyer', 'Rohan Desai', 'Sanjana Rao',
  'Aditya Nair', 'Ishita Bose', 'Karan Chopra', 'Meera Pillai', 'Vivek Menon',
  'Divya Krishnan', 'Siddharth Joshi', 'Pooja Agarwal', 'Amitabh Ghosh', 'Nandini Rao',
  'Tarun Kapoor', 'Shreya Bhatt', 'Rajesh Khanna', 'Lakshmi Venkatesh', 'Manish Tiwari',
  'Bluewave Apparel', 'Sundar Traders', 'Orchid Interiors', 'Kestrel Freight Co',
];

const rootCauses: RootCause[] = [
  RootCause.INSUFFICIENT_FUNDS, RootCause.EXPIRED_CARD, RootCause.NETWORK_ERROR, RootCause.CARD_DECLINED,
  RootCause.MULTIPLE_FAILED_ATTEMPTS, RootCause.BANK_AUTH_FAILED, RootCause.SUBSCRIPTION_LAPSED,
];

const paymentMethods = [
  'Visa •••• 4118', 'Mastercard •••• 7723', 'RuPay •••• 3390',
  'UPI ••••@okhdfc', 'Bank Transfer (NEFT)', 'Amex •••• 1004',
];

const statusPool: CaseStatus[] = [
  CaseStatus.RECOVERED, CaseStatus.RECOVERED, CaseStatus.RECOVERED, CaseStatus.ACTIVE, CaseStatus.RETRY_SCHEDULED,
  CaseStatus.RETRY_SCHEDULED, CaseStatus.ESCALATED, CaseStatus.STOPPED, CaseStatus.FAILED, CaseStatus.RECOVERED,
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function strategyFor(status: CaseStatus, cause: RootCause): { strategy: StrategyType; detail: string } {
  if (status === CaseStatus.STOPPED) return { strategy: StrategyType.STOP_AUTOMATION, detail: 'Maximum retry attempts reached — automation halted per guardrail policy' };
  if (status === CaseStatus.ESCALATED) return { strategy: StrategyType.ESCALATE_TO_HUMAN, detail: 'Routed to revenue-ops queue for manual outreach' };
  if (cause === RootCause.EXPIRED_CARD) return { strategy: StrategyType.UPDATE_PAYMENT_METHOD, detail: 'Payment link sent for card update' };
  if (cause === RootCause.B2B_INVOICE_OVERDUE) return { strategy: StrategyType.INVOICE_REMINDER, detail: 'Automated reminder sent to accounts-payable contact' };
  return { strategy: StrategyType.RETRY_PAYMENT, detail: 'Retry payment after 24 hours' };
}

export async function seedDatabase(clean = false): Promise<void> {
  if (clean) {
    await Promise.all([
      RecoveryCaseModel.deleteMany({}),
      RevenueEventModel.deleteMany({}),
      AuditLogModel.deleteMany({}),
      PolicySettingsModel.deleteMany({}),
    ]);
    console.log('🧹 Cleaned existing database collections');
  }

  const existingCount = await RecoveryCaseModel.countDocuments();
  if (existingCount > 0 && !clean) {
    console.log(`ℹ️ Database already contains ${existingCount} recovery cases. Skipping seed.`);
    return;
  }

  // 1. Initialize Policy Settings
  await PolicySettingsModel.findOneAndUpdate(
    { key: 'global' },
    {
      key: 'global',
      maxPaymentRetries: 3,
      maxCustomerContacts: 2,
      maxRecoveryWindowDays: 7,
      autoEscalation: true,
      highValueThreshold: 25000,
      aiConfidenceThreshold: 80,
    },
    { upsert: true }
  );

  const allSeeds: CaseSeed[] = [
    ...baseSeeds,
    ...extraNames.map((name, i) => {
      const id = `RC-${1030 + i}`;
      const status = pick(statusPool, i + 3);
      const cause = pick(rootCauses, i + 1);
      const { strategy, detail } = strategyFor(status, cause);
      const risk: RiskLevel = i % 3 === 0 ? RiskLevel.HIGH : i % 3 === 1 ? RiskLevel.MEDIUM : RiskLevel.LOW;
      const amount = [1500, 2200, 3200, 4800, 6000, 7500, 9200, 12000, 18500, 24000][i % 10];
      const recovered = status === CaseStatus.RECOVERED ? amount : 0;
      const createdMinsAgo = 30 + i * 47;
      const updatedMinsAgo = status === CaseStatus.RECOVERED ? Math.max(2, createdMinsAgo - 60 - i * 3) : Math.max(1, createdMinsAgo - i);
      const confidence = status === CaseStatus.RECOVERED ? 84 + (i % 12) : status === CaseStatus.ESCALATED || status === CaseStatus.STOPPED ? 48 + (i % 15) : 70 + (i % 20);

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
          status === CaseStatus.RECOVERED
            ? 'Customer payment history supports automated retry. No escalation required.'
            : status === CaseStatus.ESCALATED || status === CaseStatus.STOPPED
            ? 'Repeated failures or policy limits mean automated recovery is no longer appropriate without human review.'
            : 'Failure pattern matches a recoverable case. Recovery action scheduled per standard policy.',
        createdMinsAgo,
        updatedMinsAgo,
        retryUsed: status === CaseStatus.STOPPED ? 3 : status === CaseStatus.RECOVERED ? 1 : status === CaseStatus.ESCALATED ? 2 : 0,
        retryMax: 3,
        contactUsed: status === CaseStatus.STOPPED ? 2 : i % 2,
        contactMax: 2,
        windowUsedDays: Math.min(7, Math.floor(createdMinsAgo / 1440) + 1),
        windowMaxDays: 7,
        successfulPayments: 4 + (i % 20),
        previousFailures: i % 4,
        totalPaid: 10000 + i * 3200,
        nextActionLabel:
          status === CaseStatus.RETRY_SCHEDULED ? 'Payment retry scheduled' : status === CaseStatus.ACTIVE ? 'Awaiting customer action' : null,
        nextActionInMins: status === CaseStatus.RETRY_SCHEDULED ? 120 + i * 30 : null,
      };
    }),
  ];

  for (const s of allSeeds) {
    const createdAt = minsAgo(s.createdMinsAgo);
    const updatedAt = minsAgo(s.updatedMinsAgo);
    const nextActionAt = s.nextActionInMins ? new Date(NOW.getTime() + s.nextActionInMins * 60_000) : null;
    const customerId = `CUS-${10000 + parseInt(s.id.replace('RC-', ''), 10)}`;
    const paymentId = `PAY-${80000 + parseInt(s.id.replace('RC-', ''), 10)}`;

    // Create Event Doc
    const eventDoc = await RevenueEventModel.create({
      eventId: generateEventId(),
      customerId,
      customerName: s.customerName,
      paymentId,
      amount: s.amountAtRisk,
      currency: 'INR',
      paymentMethod: s.paymentMethod,
      failureReason: s.rootCause,
      status: 'PROCESSED',
      createdAt,
      updatedAt,
    });

    // Create Timeline
    const timeline: Array<{ timestamp: Date; label: string; detail: string; kind: TimelineKind }> = [
      {
        timestamp: createdAt,
        label: 'Payment failed',
        detail: `₹${s.amountAtRisk.toLocaleString('en-IN')} payment failed — Reason: ${s.rootCause}`,
        kind: TimelineKind.DETECT,
      },
      {
        timestamp: new Date(createdAt.getTime() + 60_000),
        label: 'Revenue risk detected',
        detail: 'Recovery case created and queued for analysis',
        kind: TimelineKind.DETECT,
      },
      {
        timestamp: new Date(createdAt.getTime() + 120_000),
        label: 'AI analysis completed',
        detail: `Confidence: ${s.aiConfidence}%`,
        kind: TimelineKind.DIAGNOSE,
      },
      {
        timestamp: new Date(createdAt.getTime() + 180_000),
        label: 'Recovery strategy selected',
        detail: s.strategyDetail,
        kind: TimelineKind.DECIDE,
      },
      {
        timestamp: new Date(createdAt.getTime() + 180_000),
        label: 'Policy validation passed',
        detail: 'Guardrail checks cleared — action permitted',
        kind: TimelineKind.VALIDATE,
      },
    ];

    if (s.status === CaseStatus.RECOVERED) {
      timeline.push(
        {
          timestamp: minsAgo(s.updatedMinsAgo + 1),
          label: `${s.strategy} executed`,
          detail: s.strategyDetail,
          kind: TimelineKind.ACT,
        },
        {
          timestamp: updatedAt,
          label: 'Payment successful',
          detail: `₹${s.amountRecovered.toLocaleString('en-IN')} recovered`,
          kind: TimelineKind.RECOVER,
        }
      );
    } else if (s.status === CaseStatus.RETRY_SCHEDULED || s.status === CaseStatus.ACTIVE) {
      timeline.push({
        timestamp: new Date(createdAt.getTime() + 240_000),
        label: 'Recovery action scheduled',
        detail: s.nextActionLabel ?? 'Next action pending',
        kind: TimelineKind.ACT,
      });
    } else if (s.status === CaseStatus.ESCALATED) {
      timeline.push(
        {
          timestamp: new Date(createdAt.getTime() + 240_000),
          label: `${s.strategy} executed`,
          detail: s.strategyDetail,
          kind: TimelineKind.ACT,
        },
        {
          timestamp: new Date(createdAt.getTime() + 300_000),
          label: 'Escalated to human review',
          detail: 'Automation confidence below threshold or repeated failures',
          kind: TimelineKind.ESCALATE,
        }
      );
    } else if (s.status === CaseStatus.STOPPED) {
      timeline.push({
        timestamp: new Date(createdAt.getTime() + 240_000),
        label: 'Automation stopped',
        detail: 'Maximum retry attempts reached — guardrail limit enforced',
        kind: TimelineKind.STOP,
      });
    } else if (s.status === CaseStatus.FAILED) {
      timeline.push({
        timestamp: new Date(createdAt.getTime() + 240_000),
        label: 'Recovery action failed',
        detail: s.strategyDetail,
        kind: TimelineKind.STOP,
      });
    }

    // Create Case Doc
    await RecoveryCaseModel.create({
      caseId: s.id,
      revenueEventId: eventDoc._id,
      customerId,
      customerName: s.customerName,
      paymentId,
      paymentMethod: s.paymentMethod,
      amountAtRisk: s.amountAtRisk,
      amountRecovered: s.amountRecovered,
      status: s.status,
      risk: s.risk,
      rootCause: s.rootCause,
      strategy: s.strategy,
      strategyDetail: s.strategyDetail,
      aiConfidence: s.aiConfidence,
      reasoning: s.reasoning,
      nextActionLabel: s.nextActionLabel,
      nextActionAt,
      history: {
        successfulPayments: s.successfulPayments,
        previousFailures: s.previousFailures,
        totalPaid: s.totalPaid,
      },
      guardrails: {
        retryUsed: s.retryUsed,
        retryMax: s.retryMax,
        contactUsed: s.contactUsed,
        contactMax: s.contactMax,
        windowUsedDays: s.windowUsedDays,
        windowMaxDays: s.windowMaxDays,
      },
      timeline,
      createdAt,
      updatedAt,
    });

    // Create Audit Logs
    const auditEntries: Array<{ action: string; actor: string; result: string; status: AuditStatus; timestamp: Date }> = [
      { action: 'PAYMENT_FAILED', actor: 'System', result: 'Detected', status: AuditStatus.INFO, timestamp: createdAt },
      { action: 'AI_ANALYSIS', actor: 'AI Agent', result: 'Completed', status: AuditStatus.SUCCESS, timestamp: new Date(createdAt.getTime() + 120_000) },
      { action: 'POLICY_CHECK', actor: 'Policy Engine', result: 'Approved', status: AuditStatus.SUCCESS, timestamp: new Date(createdAt.getTime() + 180_000) },
    ];

    if (s.status === CaseStatus.RECOVERED) {
      auditEntries.push(
        { action: 'PAYMENT_RETRY', actor: 'Recovery Agent', result: 'Success', status: AuditStatus.SUCCESS, timestamp: minsAgo(s.updatedMinsAgo + 1) },
        { action: 'RECOVERY_COMPLETED', actor: 'System', result: `₹${s.amountRecovered.toLocaleString('en-IN')} recovered`, status: AuditStatus.SUCCESS, timestamp: updatedAt }
      );
    } else if (s.status === CaseStatus.ESCALATED) {
      auditEntries.push(
        { action: 'PAYMENT_RETRY', actor: 'Recovery Agent', result: 'Failed', status: AuditStatus.FAILURE, timestamp: new Date(createdAt.getTime() + 240_000) },
        { action: 'ESCALATION', actor: 'Policy Engine', result: 'Routed to human review', status: AuditStatus.PENDING, timestamp: new Date(createdAt.getTime() + 300_000) }
      );
    } else if (s.status === CaseStatus.STOPPED) {
      auditEntries.push(
        { action: 'RETRY_LIMIT_CHECK', actor: 'Policy Engine', result: 'Limit reached', status: AuditStatus.FAILURE, timestamp: new Date(createdAt.getTime() + 240_000) },
        { action: 'AUTOMATION_STOPPED', actor: 'System', result: 'Escalation required', status: AuditStatus.PENDING, timestamp: new Date(createdAt.getTime() + 300_000) }
      );
    } else if (s.status === CaseStatus.RETRY_SCHEDULED || s.status === CaseStatus.ACTIVE) {
      auditEntries.push({
        action: 'ACTION_SCHEDULED',
        actor: 'Recovery Agent',
        result: s.nextActionLabel ?? 'Scheduled',
        status: AuditStatus.PENDING,
        timestamp: new Date(createdAt.getTime() + 240_000),
      });
    } else if (s.status === CaseStatus.FAILED) {
      auditEntries.push({ action: 'PAYMENT_RETRY', actor: 'Recovery Agent', result: 'Failed', status: AuditStatus.FAILURE, timestamp: new Date(createdAt.getTime() + 240_000) });
    }

    for (const audit of auditEntries) {
      await AuditLogModel.create({
        auditId: generateAuditId(),
        recoveryCaseId: s.id,
        action: audit.action,
        actor: audit.actor,
        result: audit.result,
        status: audit.status,
        timestamp: audit.timestamp,
      });
    }
  }

  console.log(`✅ Seeded ${allSeeds.length} recovery cases, revenue events, and audit trails.`);
}

// Direct execution CLI support
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    try {
      await connectDatabase();
      await seedDatabase(true);
      await disconnectDatabase();
      process.exit(0);
    } catch (err) {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    }
  })();
}
