import { IRecoveryCase } from './recovery-case.model.js';
import { IAuditLog } from '../audit/audit-log.model.js';
import { RecoveryCaseDto, TimelineEventDto, AuditEntryDto } from '../../shared/types/api.types.js';
import { CaseStatus } from '../../shared/constants/enums.js';

export function toRecoveryCaseDto(caseDoc: IRecoveryCase, auditLogs: IAuditLog[] = []): RecoveryCaseDto {
  const retryMax = caseDoc.guardrails?.retryMax ?? 3;
  const retryUsed = caseDoc.guardrails?.retryUsed ?? 0;
  const contactMax = caseDoc.guardrails?.contactMax ?? 2;
  const contactUsed = caseDoc.guardrails?.contactUsed ?? 0;
  const windowMaxDays = caseDoc.guardrails?.windowMaxDays ?? 7;
  const windowUsedDays = caseDoc.guardrails?.windowUsedDays ?? 0;

  const isStopped = caseDoc.status === CaseStatus.STOPPED;
  const withinWindow = windowUsedDays <= windowMaxDays;
  const eligible = !isStopped;
  const actionPermitted = !isStopped;

  const timelineDtos: TimelineEventDto[] = (caseDoc.timeline || []).map((t) => ({
    timestamp: t.timestamp instanceof Date ? t.timestamp.toISOString() : new Date(t.timestamp).toISOString(),
    label: t.label,
    detail: t.detail,
    kind: t.kind,
  }));

  const auditDtos: AuditEntryDto[] = auditLogs.map((a) => ({
    action: a.action,
    actor: a.actor,
    result: a.result,
    status: a.status,
    timestamp: a.timestamp instanceof Date ? a.timestamp.toISOString() : new Date(a.timestamp).toISOString(),
  }));

  return {
    id: caseDoc.caseId,
    customerName: caseDoc.customerName,
    customerId: caseDoc.customerId,
    paymentId: caseDoc.paymentId,
    paymentMethod: caseDoc.paymentMethod,
    amountAtRisk: caseDoc.amountAtRisk,
    amountRecovered: caseDoc.amountRecovered || 0,
    status: caseDoc.status,
    risk: caseDoc.risk,
    rootCause: caseDoc.rootCause,
    strategy: caseDoc.strategy,
    strategyDetail: caseDoc.strategyDetail,
    aiConfidence: caseDoc.aiConfidence,
    reasoning: caseDoc.reasoning,
    nextActionLabel: caseDoc.nextActionLabel,
    nextActionAt: caseDoc.nextActionAt ? new Date(caseDoc.nextActionAt).toISOString() : null,
    history: {
      successfulPayments: caseDoc.history?.successfulPayments ?? 0,
      previousFailures: caseDoc.history?.previousFailures ?? 0,
      totalPaid: caseDoc.history?.totalPaid ?? 0,
    },
    guardrails: {
      retryUsed,
      retryMax,
      contactUsed,
      contactMax,
      windowUsedDays,
      windowMaxDays,
      eligible,
      withinWindow,
      actionPermitted,
    },
    timeline: timelineDtos,
    auditLog: auditDtos,
    createdAt: caseDoc.createdAt instanceof Date ? caseDoc.createdAt.toISOString() : new Date(caseDoc.createdAt).toISOString(),
    updatedAt: caseDoc.updatedAt instanceof Date ? caseDoc.updatedAt.toISOString() : new Date(caseDoc.updatedAt).toISOString(),
  };
}

