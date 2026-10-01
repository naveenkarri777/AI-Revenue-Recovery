import { RecoveryCaseRepository, ListCasesFilter } from './recovery-case.repository.js';
import { RevenueEventRepository } from '../revenue-events/revenue-event.repository.js';
import { AuditLogService } from '../audit/audit-log.service.js';
import { PolicySettingsRepository } from '../settings/policy-settings.repository.js';
import { RecoveryContextBuilderService } from './recovery-context-builder.service.js';
import { RecoveryAgentService } from '../../agent/recovery-agent.service.js';
import { PolicyEngineService } from '../../policy/policy-engine.service.js';
import { ActionExecutorService } from '../../actions/action-executor.service.js';
import { PaymentSimulatorProvider } from '../../providers/payment/payment-simulator.provider.js';
import { toRecoveryCaseDto } from './recovery.mapper.js';
import { NotFoundError } from '../../shared/errors/error-types.js';
import { RecoveryCaseDto, PaginatedResult } from '../../shared/types/api.types.js';
import { StrategyType, TimelineKind, AuditStatus } from '../../shared/constants/enums.js';
import { AIDecision } from '../../agent/agent.types.js';
import { logger } from '../../shared/utils/logger.js';

export class RecoveryService {
  constructor(
    private caseRepo = new RecoveryCaseRepository(),
    private eventRepo = new RevenueEventRepository(),
    private auditService = new AuditLogService(),
    private policyRepo = new PolicySettingsRepository(),
    private contextBuilder = new RecoveryContextBuilderService(),
    private agent = new RecoveryAgentService(),
    private policyEngine = new PolicyEngineService(),
    private actionExecutor = new ActionExecutorService(),
    private paymentProvider = new PaymentSimulatorProvider()
  ) {}

  async listCases(filter: ListCasesFilter, page = 1, pageSize = 10): Promise<PaginatedResult<RecoveryCaseDto>> {
    const skip = (page - 1) * pageSize;
    const [docs, total] = await this.caseRepo.list(filter, skip, pageSize);

    const dtos = await Promise.all(
      docs.map(async (doc) => {
        const auditLogs = await this.auditService.getLogsForCase(doc.caseId);
        return toRecoveryCaseDto(doc, auditLogs);
      })
    );

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      items: dtos,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getCaseById(caseId: string): Promise<RecoveryCaseDto> {
    const doc = await this.caseRepo.findByCaseId(caseId);
    if (!doc) {
      throw new NotFoundError(`Recovery case '${caseId}' not found`);
    }

    const auditLogs = await this.auditService.getLogsForCase(caseId);
    return toRecoveryCaseDto(doc, auditLogs);
  }

  async getCaseAuditLogs(caseId: string) {
    const doc = await this.caseRepo.findByCaseId(caseId);
    if (!doc) {
      throw new NotFoundError(`Recovery case '${caseId}' not found`);
    }

    return this.auditService.getLogsForCase(caseId);
  }

  async processCase(caseId: string): Promise<RecoveryCaseDto> {
    const caseDoc = await this.caseRepo.findByCaseId(caseId);
    if (!caseDoc) {
      throw new NotFoundError(`Recovery case '${caseId}' not found`);
    }

    const policies = await this.policyRepo.getSettings();
    let eventDoc = null;
    if (caseDoc.revenueEventId) {
      eventDoc = await this.eventRepo.findById(caseDoc.revenueEventId.toString());
    }

    // Step 1: Assemble Context
    const context = this.contextBuilder.buildContext(caseDoc, eventDoc, policies);

    // Step 2: Call AI Decision Agent
    let decision: AIDecision;
    try {
      decision = await this.agent.decide(context);
    } catch (err) {
      logger.error(`AI Decision failed for case ${caseId}: ${(err as Error).message}`, err);
      // Auto-escalate on AI failure
      decision = {
        rootCause: caseDoc.rootCause,
        riskLevel: caseDoc.risk,
        recommendedAction: StrategyType.ESCALATE_TO_HUMAN,
        strategyDetail: 'AI analysis encountered error; routing to human review',
        retryAfterHours: null,
        confidence: 40,
        reason: 'Automated decision could not be validated with high confidence.',
      };
      await this.auditService.record(
        caseId,
        'AI_ANALYSIS',
        'AI Agent',
        'Failed - Auto escalated',
        AuditStatus.FAILURE,
        { error: (err as Error).message }
      );
    }

    await this.auditService.record(
      caseId,
      'AI_ANALYSIS',
      'AI Agent',
      'Completed',
      AuditStatus.SUCCESS,
      { confidence: decision.confidence, rootCause: decision.rootCause, action: decision.recommendedAction }
    );

    // Timeline entries for AI analysis and decision
    const timelineUpdates: Array<{ label: string; detail: string; kind: TimelineKind; timestamp: Date }> = [
      {
        timestamp: new Date(),
        label: 'AI analysis completed',
        detail: `Confidence: ${decision.confidence}%`,
        kind: TimelineKind.DIAGNOSE,
      },
      {
        timestamp: new Date(Date.now() + 500),
        label: 'Recovery strategy selected',
        detail: decision.strategyDetail,
        kind: TimelineKind.DECIDE,
      },
    ];

    // Step 3: Policy Validation
    const policyEval = this.policyEngine.evaluate(
      caseDoc,
      decision.recommendedAction,
      decision.confidence,
      policies
    );

    let finalAction = decision.recommendedAction;

    if (policyEval.approved) {
      await this.auditService.record(
        caseId,
        'POLICY_CHECK',
        'Policy Engine',
        'Approved',
        AuditStatus.SUCCESS,
        { passed: policyEval.passedChecks }
      );
      timelineUpdates.push({
        timestamp: new Date(Date.now() + 1000),
        label: 'Policy validation passed',
        detail: 'Guardrail checks cleared — action permitted',
        kind: TimelineKind.VALIDATE,
      });
    } else {
      finalAction = policyEval.recommendedAction;
      await this.auditService.record(
        caseId,
        'POLICY_CHECK',
        'Policy Engine',
        `Enforced limit (${policyEval.failedChecks.join(', ')})`,
        AuditStatus.FAILURE,
        { failed: policyEval.failedChecks, overrideAction: finalAction }
      );
      timelineUpdates.push({
        timestamp: new Date(Date.now() + 1000),
        label: 'Policy guardrail limit enforced',
        detail: policyEval.reason || 'Guardrail limits prevented automated execution',
        kind: TimelineKind.VALIDATE,
      });
    }

    // Step 4: Execute Action
    const actionResult = await this.actionExecutor.execute(finalAction, {
      caseDoc,
      paymentProvider: this.paymentProvider,
      retryAfterHours: decision.retryAfterHours,
      reason: decision.reason,
      strategyDetail: decision.strategyDetail,
    });

    // Step 5: Record Action Audit Logs
    for (const auditEntry of actionResult.auditEntries) {
      await this.auditService.record(
        caseId,
        auditEntry.action,
        auditEntry.actor,
        auditEntry.result,
        auditEntry.status,
        auditEntry.metadata
      );
    }

    // Step 6: Update RecoveryCase Document
    const currentTimeline = caseDoc.timeline || [];
    const newTimeline = [
      ...currentTimeline,
      ...timelineUpdates,
      ...actionResult.timelineEvents.map((t: { label: string; detail: string; kind: TimelineKind; timestamp?: Date }) => ({
        timestamp: t.timestamp || new Date(),
        label: t.label,
        detail: t.detail,
        kind: t.kind,
      })),
    ];

    const currentRetryUsed = caseDoc.guardrails?.retryUsed ?? 0;
    const currentContactUsed = caseDoc.guardrails?.contactUsed ?? 0;

    const updatedDoc = await this.caseRepo.updateByCaseId(caseId, {
      status: actionResult.resultingStatus,
      amountRecovered: actionResult.amountRecovered > 0 ? actionResult.amountRecovered : caseDoc.amountRecovered,
      rootCause: decision.rootCause,
      risk: decision.riskLevel,
      strategy: finalAction,
      strategyDetail: decision.strategyDetail,
      aiConfidence: decision.confidence,
      reasoning: decision.reason,
      nextActionLabel: actionResult.nextActionLabel,
      nextActionAt: actionResult.nextActionAt,
      guardrails: {
        retryUsed: currentRetryUsed + actionResult.retryUsedIncrement,
        retryMax: caseDoc.guardrails?.retryMax ?? policies.maxPaymentRetries,
        contactUsed: currentContactUsed + actionResult.contactUsedIncrement,
        contactMax: caseDoc.guardrails?.contactMax ?? policies.maxCustomerContacts,
        windowUsedDays: caseDoc.guardrails?.windowUsedDays ?? 0,
        windowMaxDays: caseDoc.guardrails?.windowMaxDays ?? policies.maxRecoveryWindowDays,
      },
      timeline: newTimeline,
    });

    const finalLogs = await this.auditService.getLogsForCase(caseId);
    return toRecoveryCaseDto(updatedDoc || caseDoc, finalLogs);
  }
}
