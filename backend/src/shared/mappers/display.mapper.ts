import { CaseStatus, RiskLevel, RootCause, StrategyType } from '../constants/enums.js';

export function mapStatusToDisplay(status: string): CaseStatus {
  if (!status) return CaseStatus.ACTIVE;
  const s = status.toLowerCase();
  if (s.includes('recover')) return CaseStatus.RECOVERED;
  if (s.includes('schedul') || s.includes('retry')) return CaseStatus.RETRY_SCHEDULED;
  if (s.includes('escalat')) return CaseStatus.ESCALATED;
  if (s.includes('stop')) return CaseStatus.STOPPED;
  if (s.includes('fail')) return CaseStatus.FAILED;
  return CaseStatus.ACTIVE;
}

export function mapRiskToDisplay(risk: string): RiskLevel {
  if (!risk) return RiskLevel.MEDIUM;
  const r = risk.toLowerCase();
  if (r.includes('high')) return RiskLevel.HIGH;
  if (r.includes('low')) return RiskLevel.LOW;
  return RiskLevel.MEDIUM;
}

export function mapRootCauseToDisplay(cause: string): RootCause {
  if (!cause) return RootCause.INSUFFICIENT_FUNDS;
  const c = cause.toLowerCase();

  if (c.includes('insufficient') || c.includes('balance') || c.includes('funds')) {
    return RootCause.INSUFFICIENT_FUNDS;
  }
  if (c.includes('expire') || c.includes('expired')) {
    return RootCause.EXPIRED_CARD;
  }
  if (c.includes('network') || c.includes('timeout') || c.includes('gateway') || c.includes('connection')) {
    return RootCause.NETWORK_ERROR;
  }
  if (c.includes('multiple') || c.includes('attempts') || c.includes('repeated')) {
    return RootCause.MULTIPLE_FAILED_ATTEMPTS;
  }
  if (c.includes('invoice') || c.includes('b2b') || c.includes('overdue')) {
    return RootCause.B2B_INVOICE_OVERDUE;
  }
  if (c.includes('auth') || c.includes('otp') || c.includes('bank') || c.includes('authorization')) {
    return RootCause.BANK_AUTH_FAILED;
  }
  if (c.includes('sub') || c.includes('lapsed') || c.includes('subscription')) {
    return RootCause.SUBSCRIPTION_LAPSED;
  }
  if (c.includes('decline') || c.includes('declined')) {
    return RootCause.CARD_DECLINED;
  }

  return RootCause.INSUFFICIENT_FUNDS;
}

export function mapStrategyToDisplay(strategy: string): StrategyType {
  if (!strategy) return StrategyType.RETRY_PAYMENT;
  const s = strategy.toLowerCase();

  if (s.includes('update') || s.includes('method') || s.includes('card update')) {
    return StrategyType.UPDATE_PAYMENT_METHOD;
  }
  if (s.includes('link') || s.includes('send payment')) {
    return StrategyType.SEND_PAYMENT_LINK;
  }
  if (s.includes('escalat') || s.includes('human')) {
    return StrategyType.ESCALATE_TO_HUMAN;
  }
  if (s.includes('stop') || s.includes('halt')) {
    return StrategyType.STOP_AUTOMATION;
  }
  if (s.includes('invoice') || s.includes('reminder')) {
    return StrategyType.INVOICE_REMINDER;
  }

  return StrategyType.RETRY_PAYMENT;
}
