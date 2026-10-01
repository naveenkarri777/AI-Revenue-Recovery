import { IRecoveryCase } from '../modules/recovery/recovery-case.model.js';
import { IPolicySettings } from '../modules/settings/policy-settings.model.js';
import { StrategyType } from '../shared/constants/enums.js';
import { PolicyCheckResult } from './policy.types.js';

export function checkRetryLimit(
  caseDoc: IRecoveryCase,
  candidateAction: StrategyType,
  _aiConfidence: number,
  policies: IPolicySettings
): PolicyCheckResult {
  const retryLimit = policies.maxPaymentRetries ?? 3;
  const retryUsed = caseDoc.guardrails?.retryUsed ?? 0;

  if (candidateAction === StrategyType.RETRY_PAYMENT && retryUsed >= retryLimit) {
    return {
      ruleName: 'RetryLimitCheck',
      passed: false,
      message: `Maximum payment retries (${retryLimit}) reached`,
      suggestedAction: StrategyType.STOP_AUTOMATION,
    };
  }

  return {
    ruleName: 'RetryLimitCheck',
    passed: true,
  };
}

export function checkConfidence(
  _caseDoc: IRecoveryCase,
  candidateAction: StrategyType,
  aiConfidence: number,
  policies: IPolicySettings
): PolicyCheckResult {
  const threshold = policies.aiConfidenceThreshold ?? 80;

  // Don't flag confidence check if the action is already manual escalation or stop
  if (candidateAction === StrategyType.ESCALATE_TO_HUMAN || candidateAction === StrategyType.STOP_AUTOMATION) {
    return { ruleName: 'ConfidenceCheck', passed: true };
  }

  if (aiConfidence < threshold) {
    return {
      ruleName: 'ConfidenceCheck',
      passed: false,
      message: `AI confidence (${aiConfidence}%) is below minimum threshold (${threshold}%)`,
      suggestedAction: StrategyType.ESCALATE_TO_HUMAN,
    };
  }

  return {
    ruleName: 'ConfidenceCheck',
    passed: true,
  };
}

export function checkWindow(
  caseDoc: IRecoveryCase,
  _candidateAction: StrategyType,
  _aiConfidence: number,
  policies: IPolicySettings
): PolicyCheckResult {
  const maxDays = policies.maxRecoveryWindowDays ?? 7;
  const usedDays = caseDoc.guardrails?.windowUsedDays ?? 0;

  if (usedDays > maxDays) {
    return {
      ruleName: 'RecoveryWindowCheck',
      passed: false,
      message: `Case exceeds maximum recovery window of ${maxDays} days`,
      suggestedAction: StrategyType.ESCALATE_TO_HUMAN,
    };
  }

  return {
    ruleName: 'RecoveryWindowCheck',
    passed: true,
  };
}

export function checkAmount(
  caseDoc: IRecoveryCase,
  candidateAction: StrategyType,
  _aiConfidence: number,
  policies: IPolicySettings
): PolicyCheckResult {
  const threshold = policies.highValueThreshold ?? 25000;

  if (
    caseDoc.amountAtRisk > threshold &&
    candidateAction !== StrategyType.ESCALATE_TO_HUMAN &&
    candidateAction !== StrategyType.STOP_AUTOMATION
  ) {
    return {
      ruleName: 'HighValueThresholdCheck',
      passed: false,
      message: `Amount at risk (₹${caseDoc.amountAtRisk.toLocaleString('en-IN')}) exceeds high-value threshold (₹${threshold.toLocaleString('en-IN')})`,
      suggestedAction: StrategyType.ESCALATE_TO_HUMAN,
    };
  }

  return {
    ruleName: 'HighValueThresholdCheck',
    passed: true,
  };
}

export function checkContactLimit(
  caseDoc: IRecoveryCase,
  candidateAction: StrategyType,
  _aiConfidence: number,
  policies: IPolicySettings
): PolicyCheckResult {
  const contactLimit = policies.maxCustomerContacts ?? 2;
  const contactUsed = caseDoc.guardrails?.contactUsed ?? 0;

  const isContactAction =
    candidateAction === StrategyType.UPDATE_PAYMENT_METHOD ||
    candidateAction === StrategyType.SEND_PAYMENT_LINK ||
    candidateAction === StrategyType.INVOICE_REMINDER;

  if (isContactAction && contactUsed >= contactLimit) {
    return {
      ruleName: 'ContactLimitCheck',
      passed: false,
      message: `Maximum customer contacts (${contactLimit}) reached`,
      suggestedAction: StrategyType.ESCALATE_TO_HUMAN,
    };
  }

  return {
    ruleName: 'ContactLimitCheck',
    passed: true,
  };
}

