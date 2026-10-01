import { PolicySettingsRepository } from './policy-settings.repository.js';
import { IPolicySettings } from './policy-settings.model.js';

export interface UpdatePolicySettingsDto {
  maxPaymentRetries?: number;
  maxCustomerContacts?: number;
  maxRecoveryWindowDays?: number;
  autoEscalation?: boolean;
  highValueThreshold?: number;
  aiConfidenceThreshold?: number;
}

export class PolicySettingsService {
  constructor(private repository = new PolicySettingsRepository()) {}

  async getSettings(): Promise<IPolicySettings> {
    return this.repository.getSettings();
  }

  async updateSettings(dto: UpdatePolicySettingsDto): Promise<IPolicySettings> {
    return this.repository.updateSettings(dto);
  }
}

