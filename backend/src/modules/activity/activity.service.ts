import { AuditLogService } from '../audit/audit-log.service.js';
import { RecoveryCaseRepository } from '../recovery/recovery-case.repository.js';
import { ActivityItemDto } from '../../shared/types/api.types.js';

export class ActivityService {
  constructor(
    private auditService = new AuditLogService(),
    private caseRepo = new RecoveryCaseRepository()
  ) {}

  async getActivityFeed(limit = 20): Promise<ActivityItemDto[]> {
    const recentLogs = await this.auditService.getRecentLogs(limit);

    return recentLogs.map((log) => {
      let category: ActivityItemDto['category'] = 'AI Decision';
      let icon: ActivityItemDto['icon'] = 'detect';

      if (log.action === 'PAYMENT_RETRY' && log.status === 'success') {
        category = 'Successful';
        icon = 'success';
      } else if (log.action === 'RECOVERY_COMPLETED') {
        category = 'Successful';
        icon = 'success';
      } else if (log.action === 'ESCALATION') {
        category = 'Escalated';
        icon = 'escalate';
      } else if (log.action === 'AUTOMATION_STOPPED' || (log.action === 'PAYMENT_RETRY' && log.status === 'failure')) {
        category = 'Failed';
        icon = 'stop';
      } else if (log.action === 'ACTION_SCHEDULED' || log.action === 'PAYMENT_RETRY') {
        category = 'Recovery Action';
        icon = 'retry';
      } else if (log.action === 'AI_ANALYSIS') {
        category = 'AI Decision';
        icon = 'detect';
      }

      const message =
        log.action === 'RECOVERY_COMPLETED' || (log.action === 'PAYMENT_RETRY' && log.status === 'success')
          ? `${log.result}`
          : log.action === 'ACTION_SCHEDULED'
          ? `${log.result}`
          : log.action === 'ESCALATION'
          ? 'Case escalated to human review'
          : log.action === 'AUTOMATION_STOPPED'
          ? 'Recovery stopped — retry limit reached'
          : `${log.actor} ${log.action.toLowerCase().replace(/_/g, ' ')}: ${log.result}`;

      return {
        id: log.auditId,
        caseId: log.recoveryCaseId,
        message,
        category,
        timestamp: log.timestamp.toISOString(),
        icon,
      };
    });
  }
}

