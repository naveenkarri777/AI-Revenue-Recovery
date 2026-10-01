import { AuditLogModel, IAuditLog } from './audit-log.model.js';
import { AuditStatus } from '../../shared/constants/enums.js';

export interface CreateAuditLogInput {
  auditId: string;
  recoveryCaseId: string;
  action: string;
  actor: string;
  result: string;
  status?: AuditStatus;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

export class AuditLogRepository {
  async create(input: CreateAuditLogInput): Promise<IAuditLog> {
    const doc = new AuditLogModel(input);
    return doc.save();
  }

  async findByCaseId(recoveryCaseId: string): Promise<IAuditLog[]> {
    return AuditLogModel.find({ recoveryCaseId }).sort({ timestamp: 1, createdAt: 1 }).exec();
  }

  async listRecent(limit = 20): Promise<IAuditLog[]> {
    return AuditLogModel.find().sort({ timestamp: -1 }).limit(limit).exec();
  }

  async countByCaseId(recoveryCaseId: string): Promise<number> {
    return AuditLogModel.countDocuments({ recoveryCaseId }).exec();
  }
}

