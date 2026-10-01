import { IRecoveryCase } from './recovery-case.model.js';
import { IRevenueEvent } from '../revenue-events/revenue-event.model.js';
import { IPolicySettings } from '../settings/policy-settings.model.js';
import { RecoveryContext } from '../../agent/agent.types.js';

export class RecoveryContextBuilderService {
  buildContext(
    caseDoc: IRecoveryCase,
    eventDoc: IRevenueEvent | null,
    policies: IPolicySettings
  ): RecoveryContext {
    const daysSinceCreated = Math.max(
      0,
      Math.floor((Date.now() - new Date(caseDoc.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      caseId: caseDoc.caseId,
      payment: {
        paymentId: caseDoc.paymentId,
        amount: caseDoc.amountAtRisk,
        currency: eventDoc?.currency || 'INR',
        paymentMethod: caseDoc.paymentMethod,
        failureReason: eventDoc?.failureReason || caseDoc.rootCause || 'Payment failure detected',
      },
      customer: {
        customerId: caseDoc.customerId,
        customerName: caseDoc.customerName,
        successfulPayments: caseDoc.history?.successfulPayments ?? 0,
        previousFailures: caseDoc.history?.previousFailures ?? 0,
        totalPaid: caseDoc.history?.totalPaid ?? 0,
      },
      recovery: {
        retryCount: caseDoc.guardrails?.retryUsed ?? 0,
        maxRetries: policies.maxPaymentRetries ?? 3,
        contactsCount: caseDoc.guardrails?.contactUsed ?? 0,
        maxContacts: policies.maxCustomerContacts ?? 2,
        daysSinceCreated,
        maxWindowDays: policies.maxRecoveryWindowDays ?? 7,
      },
      policyConstraints: {
        highValueThreshold: policies.highValueThreshold ?? 25000,
        aiConfidenceThreshold: policies.aiConfidenceThreshold ?? 80,
      },
    };
  }
}

