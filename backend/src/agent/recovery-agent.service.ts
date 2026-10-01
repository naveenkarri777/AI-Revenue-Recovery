import { AIDecisionService } from './ai-decision.service.js';
import { RecoveryContext, AIDecision } from './agent.types.js';

export class RecoveryAgentService {
  private decisionService: AIDecisionService;

  constructor(decisionService = new AIDecisionService()) {
    this.decisionService = decisionService;
  }

  async decide(context: RecoveryContext): Promise<AIDecision> {
    return this.decisionService.decide(context);
  }
}

