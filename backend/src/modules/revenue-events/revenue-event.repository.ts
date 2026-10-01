import { RevenueEventModel, IRevenueEvent } from './revenue-event.model.js';

export interface CreateRevenueEventInput {
  eventId: string;
  customerId: string;
  customerName: string;
  paymentId: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  failureReason: string;
  metadata?: Record<string, unknown>;
}

export class RevenueEventRepository {
  async create(input: CreateRevenueEventInput): Promise<IRevenueEvent> {
    const event = new RevenueEventModel(input);
    return event.save();
  }

  async findByEventId(eventId: string): Promise<IRevenueEvent | null> {
    return RevenueEventModel.findOne({ eventId }).exec();
  }

  async findById(id: string): Promise<IRevenueEvent | null> {
    return RevenueEventModel.findById(id).exec();
  }

  async findByPaymentId(paymentId: string): Promise<IRevenueEvent | null> {
    return RevenueEventModel.findOne({ paymentId }).exec();
  }

  async findByCustomerId(customerId: string): Promise<IRevenueEvent[]> {
    return RevenueEventModel.find({ customerId }).sort({ createdAt: -1 }).exec();
  }

  async list(filter: Record<string, unknown> = {}, skip = 0, limit = 50): Promise<[IRevenueEvent[], number]> {
    const [items, total] = await Promise.all([
      RevenueEventModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      RevenueEventModel.countDocuments(filter).exec(),
    ]);
    return [items, total];
  }

  async updateStatus(eventId: string, status: 'PENDING' | 'PROCESSED' | 'IGNORED'): Promise<IRevenueEvent | null> {
    return RevenueEventModel.findOneAndUpdate({ eventId }, { $set: { status } }, { new: true }).exec();
  }
}

