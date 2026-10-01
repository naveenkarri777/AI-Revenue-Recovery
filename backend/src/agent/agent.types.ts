import { z } from 'zod';
import { RootCause, RiskLevel, StrategyType } from '../shared/constants/enums.js';

export interface RecoveryContext {
  caseId: string;
  payment: {
    paymentId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    failureReason: string;
  };
  customer: {
    customerId: string;
    customerName: string;
    successfulPayments: number;
    previousFailures: number;
    totalPaid: number;
  };
  recovery: {
    retryCount: number;
    maxRetries: number;
    contactsCount: number;
    maxContacts: number;
    daysSinceCreated: number;
    maxWindowDays: number;
  };
  policyConstraints?: {
    highValueThreshold: number;
    aiConfidenceThreshold: number;
  };
}

export const AIDecisionSchema = z.object({
  rootCause: z.nativeEnum(RootCause),
  riskLevel: z.nativeEnum(RiskLevel),
  recommendedAction: z.nativeEnum(StrategyType),
  strategyDetail: z.string().min(5),
  retryAfterHours: z.number().nullable().optional(),
  confidence: z.number().min(0).max(100),
  reason: z.string().min(10),
});

export type AIDecision = z.infer<typeof AIDecisionSchema>;

