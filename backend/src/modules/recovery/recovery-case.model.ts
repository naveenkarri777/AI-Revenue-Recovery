import mongoose, { Document, Schema } from 'mongoose';
import { CaseStatus, RiskLevel, RootCause, StrategyType, TimelineKind } from '../../shared/constants/enums.js';

export interface ITimelineEvent {
  timestamp: Date;
  label: string;
  detail: string;
  kind: TimelineKind;
}

export interface IPaymentHistory {
  successfulPayments: number;
  previousFailures: number;
  totalPaid: number;
}

export interface IGuardrails {
  retryUsed: number;
  retryMax: number;
  contactUsed: number;
  contactMax: number;
  windowUsedDays: number;
  windowMaxDays: number;
}

export interface IRecoveryCase extends Document {
  caseId: string;
  revenueEventId?: mongoose.Types.ObjectId | string;
  customerId: string;
  customerName: string;
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
  nextActionAt: Date | null;
  history: IPaymentHistory;
  guardrails: IGuardrails;
  timeline: ITimelineEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const TimelineEventSchema = new Schema<ITimelineEvent>(
  {
    timestamp: { type: Date, default: Date.now },
    label: { type: String, required: true },
    detail: { type: String, required: true },
    kind: {
      type: String,
      enum: Object.values(TimelineKind),
      default: TimelineKind.DETECT,
    },
  },
  { _id: false }
);

const PaymentHistorySchema = new Schema<IPaymentHistory>(
  {
    successfulPayments: { type: Number, default: 0 },
    previousFailures: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
  },
  { _id: false }
);

const GuardrailsSchema = new Schema<IGuardrails>(
  {
    retryUsed: { type: Number, default: 0 },
    retryMax: { type: Number, default: 3 },
    contactUsed: { type: Number, default: 0 },
    contactMax: { type: Number, default: 2 },
    windowUsedDays: { type: Number, default: 0 },
    windowMaxDays: { type: Number, default: 7 },
  },
  { _id: false }
);

const RecoveryCaseSchema = new Schema<IRecoveryCase>(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    revenueEventId: { type: Schema.Types.Mixed, ref: 'RevenueEvent', index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    paymentId: { type: String, required: true, index: true },
    paymentMethod: { type: String, required: true },
    amountAtRisk: { type: Number, required: true },
    amountRecovered: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(CaseStatus),
      default: CaseStatus.ACTIVE,
      index: true,
    },
    risk: {
      type: String,
      enum: Object.values(RiskLevel),
      default: RiskLevel.MEDIUM,
      index: true,
    },
    rootCause: {
      type: String,
      enum: Object.values(RootCause),
      default: RootCause.INSUFFICIENT_FUNDS,
    },
    strategy: {
      type: String,
      enum: Object.values(StrategyType),
      default: StrategyType.RETRY_PAYMENT,
    },
    strategyDetail: { type: String, default: '' },
    aiConfidence: { type: Number, min: 0, max: 100, default: 80 },
    reasoning: { type: String, default: '' },
    nextActionLabel: { type: String, default: null },
    nextActionAt: { type: Date, default: null },
    history: { type: PaymentHistorySchema, required: true },
    guardrails: { type: GuardrailsSchema, required: true },
    timeline: { type: [TimelineEventSchema], default: [] },
  },
  { timestamps: true }
);

export const RecoveryCaseModel = mongoose.model<IRecoveryCase>('RecoveryCase', RecoveryCaseSchema);

