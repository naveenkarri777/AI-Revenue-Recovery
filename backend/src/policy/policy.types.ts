import { IRecoveryCase } from '../modules/recovery/recovery-case.model.js';
import { IPolicySettings } from '../modules/settings/policy-settings.model.js';
import { StrategyType } from '../shared/constants/enums.js';

export interface PolicyCheckResult {
  ruleName: string;
  passed: boolean;
  message?: string;
  suggestedAction?: StrategyType;
}

export interface PolicyEvaluation {
  approved: boolean;
  recommendedAction: StrategyType;
  passedChecks: string[];
  failedChecks: string[];
  reason?: string;
}

export type PolicyRuleFunction = (
  caseDoc: IRecoveryCase,
  candidateAction: StrategyType,
  aiConfidence: number,
  policies: IPolicySettings
) => PolicyCheckResult;

