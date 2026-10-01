import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { env } from '../config/env.js';
import { RecoveryContext, AIDecision, AIDecisionSchema } from './agent.types.js';
import { AGENT_SYSTEM_PROMPT, buildAgentUserPrompt } from './agent.prompts.js';
import { RootCause, RiskLevel, StrategyType } from '../shared/constants/enums.js';
import { AIInvalidResponseError } from '../shared/errors/error-types.js';
import { logger } from '../shared/utils/logger.js';

export class AIDecisionService {
  private geminiClient: GoogleGenerativeAI | null = null;
  private openaiClient: OpenAI | null = null;

  constructor() {
    if (env.GEMINI_API_KEY) {
      try {
        this.geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      } catch (err) {
        logger.warn('Failed to initialize Gemini client', { err: (err as Error).message });
      }
    }

    if (env.OPENAI_API_KEY) {
      try {
        this.openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
      } catch (err) {
        logger.warn('Failed to initialize OpenAI client', { err: (err as Error).message });
      }
    }
  }

  async decide(context: RecoveryContext): Promise<AIDecision> {
    const provider = env.LLM_PROVIDER;

    try {
      if (provider === 'gemini' && this.geminiClient) {
        return await this.callGemini(context);
      }

      if (provider === 'openai' && this.openaiClient) {
        return await this.callOpenAI(context);
      }

      // Default or fallback heuristic engine
      return this.heuristicDecision(context);
    } catch (error) {
      logger.warn(`AI model invocation failed, falling back to heuristic: ${(error as Error).message}`);
      return this.heuristicDecision(context);
    }
  }

  private async callGemini(context: RecoveryContext): Promise<AIDecision> {
    if (!this.geminiClient) throw new Error('Gemini client not initialized');

    const model = this.geminiClient.getGenerativeModel({
      model: env.GEMINI_MODEL || 'gemini-1.5-flash',
      systemInstruction: AGENT_SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const prompt = buildAgentUserPrompt(context);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return this.parseAndValidate(text);
  }

  private async callOpenAI(context: RecoveryContext): Promise<AIDecision> {
    if (!this.openaiClient) throw new Error('OpenAI client not initialized');

    const prompt = buildAgentUserPrompt(context);
    const response = await this.openaiClient.chat.completions.create({
      model: env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: AGENT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new AIInvalidResponseError('Empty response from OpenAI');

    return this.parseAndValidate(content);
  }

  private parseAndValidate(jsonString: string): AIDecision {
    let parsed: unknown;
    try {
      const clean = jsonString.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsed = JSON.parse(clean);
    } catch (err) {
      throw new AIInvalidResponseError(`JSON parse error: ${(err as Error).message}`);
    }

    const validated = AIDecisionSchema.safeParse(parsed);
    if (!validated.success) {
      throw new AIInvalidResponseError(
        `AI output did not adhere to schema: ${JSON.stringify(validated.error.format())}`
      );
    }

    return validated.data;
  }

  public heuristicDecision(ctx: RecoveryContext): AIDecision {
    const failure = (ctx.payment.failureReason || '').toLowerCase();
    const method = (ctx.payment.paymentMethod || '').toLowerCase();
    const retries = ctx.recovery.retryCount;
    const successes = ctx.customer.successfulPayments;
    const failures = ctx.customer.previousFailures;
    const amount = ctx.payment.amount;

    // Diagnose Root Cause
    let rootCause: RootCause = RootCause.INSUFFICIENT_FUNDS;
    if (failure.includes('expired') || method.includes('expired')) {
      rootCause = RootCause.EXPIRED_CARD;
    } else if (failure.includes('network') || failure.includes('timeout') || failure.includes('gateway')) {
      rootCause = RootCause.NETWORK_ERROR;
    } else if (failure.includes('decline') || failure.includes('declined')) {
      rootCause = RootCause.CARD_DECLINED;
    } else if (failure.includes('invoice') || failure.includes('b2b') || failure.includes('neft') || failure.includes('bank transfer')) {
      rootCause = RootCause.B2B_INVOICE_OVERDUE;
    } else if (failure.includes('auth') || failure.includes('authorization') || failure.includes('otp')) {
      rootCause = RootCause.BANK_AUTH_FAILED;
    } else if (failure.includes('sub') || failure.includes('lapsed') || failure.includes('cancelled')) {
      rootCause = RootCause.SUBSCRIPTION_LAPSED;
    } else if (retries >= 2 || failures >= 3) {
      rootCause = RootCause.MULTIPLE_FAILED_ATTEMPTS;
    }

    // Determine Risk Level
    let riskLevel: RiskLevel = RiskLevel.MEDIUM;
    if (amount > 15000 || failures > 2 || retries >= 2 || rootCause === RootCause.MULTIPLE_FAILED_ATTEMPTS) {
      riskLevel = RiskLevel.HIGH;
    } else if (successes >= 10 && failures <= 1) {
      riskLevel = RiskLevel.LOW;
    }

    // Determine Strategy and Confidence
    let recommendedAction: StrategyType = StrategyType.RETRY_PAYMENT;
    let strategyDetail = 'Retry payment after 24 hours';
    let retryAfterHours: number | null = 24;
    let confidence = 85;
    let reason = 'Customer payment history supports automated recovery retry.';

    if (rootCause === RootCause.EXPIRED_CARD) {
      recommendedAction = StrategyType.UPDATE_PAYMENT_METHOD;
      strategyDetail = 'Payment link sent for card update';
      retryAfterHours = null;
      confidence = 81;
      reason = 'Card on file expired. Retrying will not succeed until customer updates payment method.';
    } else if (rootCause === RootCause.NETWORK_ERROR) {
      recommendedAction = StrategyType.RETRY_PAYMENT;
      strategyDetail = 'Retry payment after 6 hours — likely transient gateway failure';
      retryAfterHours = 6;
      confidence = 90;
      reason = 'Payment failure matches a known gateway timeout signature rather than customer default.';
    } else if (rootCause === RootCause.B2B_INVOICE_OVERDUE) {
      if (amount >= 25000) {
        recommendedAction = StrategyType.ESCALATE_TO_HUMAN;
        strategyDetail = 'High-value invoice routed for account-manager review';
        retryAfterHours = null;
        confidence = 70;
        reason = 'Invoice value exceeds auto-approval threshold. Requires account manager outreach.';
      } else {
        recommendedAction = StrategyType.INVOICE_REMINDER;
        strategyDetail = 'Automated reminder sent to accounts-payable contact';
        retryAfterHours = null;
        confidence = 82;
        reason = 'Overdue B2B invoice within standard threshold. Dispatched payment reminder.';
      }
    } else if (retries >= ctx.recovery.maxRetries) {
      recommendedAction = StrategyType.STOP_AUTOMATION;
      strategyDetail = 'Maximum retry attempts reached — automation halted per guardrail policy';
      retryAfterHours = null;
      confidence = 55;
      reason = 'Maximum retry limits exceeded without resolution. Escalation required.';
    } else if (retries >= 2 || failures >= 3) {
      recommendedAction = StrategyType.ESCALATE_TO_HUMAN;
      strategyDetail = 'Routed to revenue-ops queue for manual outreach';
      retryAfterHours = null;
      confidence = 64;
      reason = 'Consecutive failure pattern detected. Automated recovery confidence below action threshold.';
    } else if (successes >= 5) {
      recommendedAction = StrategyType.RETRY_PAYMENT;
      strategyDetail = 'Retry payment after 24 hours';
      retryAfterHours = 24;
      confidence = 92;
      reason = 'The customer has a strong historical payment record. Current failure appears temporary.';
    }

    return {
      rootCause,
      riskLevel,
      recommendedAction,
      strategyDetail,
      retryAfterHours,
      confidence,
      reason,
    };
  }
}

