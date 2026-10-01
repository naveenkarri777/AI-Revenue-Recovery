import mongoose, { Document, Schema } from 'mongoose';

export interface IRevenueEvent extends Document {
  eventId: string;
  customerId: string;
  customerName: string;
  paymentId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  failureReason: string;
  status: 'PENDING' | 'PROCESSED' | 'IGNORED';
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const RevenueEventSchema = new Schema<IRevenueEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    paymentId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paymentMethod: { type: String, required: true },
    failureReason: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'IGNORED'],
      default: 'PENDING',
      index: true,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const RevenueEventModel = mongoose.model<IRevenueEvent>('RevenueEvent', RevenueEventSchema);

