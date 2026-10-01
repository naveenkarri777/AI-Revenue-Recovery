import { AuditLogRepository, CreateAuditLogInput } from './audit-log.repository.js';
import { IAuditLog } from './audit-log.model.js';
import { generateAuditId } from '../../shared/utils/id-generator.js';
import { AuditStatus } from '../../shared/constants/enums.js';

export class AuditLogService {
  constructor(private repository = new AuditLogRepository()) {}

  async record(
    recoveryCaseId: string,
    action: string,
    actor: string,
    result: string,
    status: AuditStatus = AuditStatus.INFO,
    metadata?: Record<string, unknown>,
    timestamp = new Date()
  ): Promise<IAuditLog> {
    const input: CreateAuditLogInput = {
      auditId: generateAuditId(),
      recoveryCaseId,
      action,
      actor,
      result,
      status,
      metadata,
      timestamp,
    };
    return this.repository.create(input);
  }

  async getLogsForCase(caseId: string): Promise<IAuditLog[]> {
    return this.repository.findByCaseId(caseId);
  }

  async getRecentLogs(limit = 20): Promise<IAuditLog[]> {
    return this.repository.listRecent(limit);
  }
}

