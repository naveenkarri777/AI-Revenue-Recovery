import { IRecoveryCase } from '../modules/recovery/recovery-case.model.js';
import { IPolicySettings } from '../modules/settings/policy-settings.model.js';
import { StrategyType } from '../shared/constants/enums.js';
import { PolicyEvaluation, PolicyRuleFunction } from './policy.types.js';
import {
  checkRetryLimit,
  checkConfidence,
  checkWindow,
  checkAmount,
  checkContactLimit,
} from './policy.rules.js';

export class PolicyEngineService {
  private rules: PolicyRuleFunction[] = [
    checkRetryLimit,
    checkConfidence,
    checkWindow,
    checkAmount,
    checkContactLimit,
  ];

  evaluate(
    caseDoc: IRecoveryCase,
    candidateAction: StrategyType,
    aiConfidence: number,
    policies: IPolicySettings
  ): PolicyEvaluation {
    const passedChecks: string[] = [];
    const failedChecks: string[] = [];
    let overrideAction: StrategyType | null = null;
    let failureReason: string | undefined;

    for (const rule of this.rules) {
      const result = rule(caseDoc, candidateAction, aiConfidence, policies);
      if (result.passed) {
        passedChecks.push(result.ruleName);
      } else {
        failedChecks.push(result.ruleName);
        if (!overrideAction && result.suggestedAction) {
          overrideAction = result.suggestedAction;
          failureReason = result.message;
        }
      }
    }

    if (failedChecks.length > 0) {
      return {
        approved: false,
        recommendedAction: overrideAction || StrategyType.ESCALATE_TO_HUMAN,
        passedChecks,
        failedChecks,
        reason: failureReason || 'Policy validation guardrail limit enforced',
      };
    }

    return {
      approved: true,
      recommendedAction: candidateAction,
      passedChecks,
      failedChecks: [],
    };
  }
}

