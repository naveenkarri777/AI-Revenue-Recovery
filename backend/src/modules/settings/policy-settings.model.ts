import mongoose, { Document, Schema } from 'mongoose';

export interface IPolicySettings extends Document {
  key: string;
  maxPaymentRetries: number;
  maxCustomerContacts: number;
  maxRecoveryWindowDays: number;
  autoEscalation: boolean;
  highValueThreshold: number;
  aiConfidenceThreshold: number;
  updatedAt: Date;
}

const PolicySettingsSchema = new Schema<IPolicySettings>(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    maxPaymentRetries: { type: Number, default: 3 },
    maxCustomerContacts: { type: Number, default: 2 },
    maxRecoveryWindowDays: { type: Number, default: 7 },
    autoEscalation: { type: Boolean, default: true },
    highValueThreshold: { type: Number, default: 25000 },
    aiConfidenceThreshold: { type: Number, default: 80 },
  },
  { timestamps: true }
);

export const PolicySettingsModel = mongoose.model<IPolicySettings>('PolicySettings', PolicySettingsSchema);

