import { RecoveryCaseModel, IRecoveryCase, ITimelineEvent } from './recovery-case.model.js';
import { CaseStatus, RiskLevel } from '../../shared/constants/enums.js';

export interface CreateRecoveryCaseInput {
  caseId: string;
  revenueEventId?: string;
  customerId: string;
  customerName: string;
  paymentId: string;
  paymentMethod: string;
  amountAtRisk: number;
  amountRecovered?: number;
  status?: CaseStatus;
  risk?: RiskLevel;
  rootCause?: string;
  strategy?: string;
  strategyDetail?: string;
  aiConfidence?: number;
  reasoning?: string;
  nextActionLabel?: string | null;
  nextActionAt?: Date | null;
  history: {
    successfulPayments: number;
    previousFailures: number;
    totalPaid: number;
  };
  guardrails: {
    retryUsed: number;
    retryMax: number;
    contactUsed: number;
    contactMax: number;
    windowUsedDays: number;
    windowMaxDays: number;
  };
  timeline?: ITimelineEvent[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ListCasesFilter {
  query?: string;
  status?: string;
  risk?: string;
}

export class RecoveryCaseRepository {
  async create(input: CreateRecoveryCaseInput): Promise<IRecoveryCase> {
    const doc = new RecoveryCaseModel(input);
    return doc.save();
  }

  async findByCaseId(caseId: string): Promise<IRecoveryCase | null> {
    return RecoveryCaseModel.findOne({ caseId }).exec();
  }

  async findById(id: string): Promise<IRecoveryCase | null> {
    return RecoveryCaseModel.findById(id).exec();
  }

  async findByPaymentId(paymentId: string): Promise<IRecoveryCase | null> {
    return RecoveryCaseModel.findOne({ paymentId }).exec();
  }

  async updateByCaseId(caseId: string, update: Partial<IRecoveryCase> | Record<string, unknown>): Promise<IRecoveryCase | null> {
    return RecoveryCaseModel.findOneAndUpdate(
      { caseId },
      { $set: update },
      { new: true }
    ).exec();
  }

  async appendTimelineEvent(caseId: string, event: ITimelineEvent): Promise<IRecoveryCase | null> {
    return RecoveryCaseModel.findOneAndUpdate(
      { caseId },
      { $push: { timeline: event }, $set: { updatedAt: new Date() } },
      { new: true }
    ).exec();
  }

  async list(filter: ListCasesFilter = {}, skip = 0, limit = 50): Promise<[IRecoveryCase[], number]> {
    const query: Record<string, unknown> = {};

    if (filter.query && filter.query.trim()) {
      const q = filter.query.trim();
      query.$or = [
        { customerName: { $regex: q, $options: 'i' } },
        { caseId: { $regex: q, $options: 'i' } },
        { paymentId: { $regex: q, $options: 'i' } },
      ];
    }

    if (filter.status && filter.status !== 'All Statuses' && filter.status !== 'All') {
      query.status = filter.status;
    }

    if (filter.risk && filter.risk !== 'All Risk' && filter.risk !== 'All') {
      query.risk = filter.risk;
    }

    const [items, total] = await Promise.all([
      RecoveryCaseModel.find(query).sort({ updatedAt: -1, createdAt: -1 }).skip(skip).limit(limit).exec(),
      RecoveryCaseModel.countDocuments(query).exec(),
    ]);

    return [items, total];
  }

  async getStatusStats(): Promise<{
    all: number;
    active: number;
    recovered: number;
    escalated: number;
    stopped: number;
  }> {
    const cases = await RecoveryCaseModel.find({}, { status: 1 }).lean().exec();
    const all = cases.length;
    let active = 0;
    let recovered = 0;
    let escalated = 0;
    let stopped = 0;

    for (const c of cases) {
      if (c.status === CaseStatus.ACTIVE || c.status === CaseStatus.RETRY_SCHEDULED) {
        active++;
      } else if (c.status === CaseStatus.RECOVERED) {
        recovered++;
      } else if (c.status === CaseStatus.ESCALATED) {
        escalated++;
      } else if (c.status === CaseStatus.STOPPED || c.status === CaseStatus.FAILED) {
        stopped++;
      }
    }

    return { all, active, recovered, escalated, stopped };
  }

  async getRecentCases(limit = 7): Promise<IRecoveryCase[]> {
    return RecoveryCaseModel.find().sort({ updatedAt: -1, createdAt: -1 }).limit(limit).exec();
  }

  async countAll(): Promise<number> {
    return RecoveryCaseModel.countDocuments().exec();
  }

  async getAll(): Promise<IRecoveryCase[]> {
    return RecoveryCaseModel.find().sort({ updatedAt: -1, createdAt: -1 }).exec();
  }
}

