import mongoose, { Document, Schema } from 'mongoose';
import { AuditStatus } from '../../shared/constants/enums.js';

export interface IAuditLog extends Document {
  auditId: string;
  recoveryCaseId: string;
  action: string;
  actor: string;
  result: string;
  status: AuditStatus;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    auditId: { type: String, required: true, unique: true, index: true },
    recoveryCaseId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    actor: { type: String, required: true },
    result: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(AuditStatus),
      default: AuditStatus.INFO,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

