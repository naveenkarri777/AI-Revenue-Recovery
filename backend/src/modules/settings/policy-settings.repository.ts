import { PolicySettingsModel, IPolicySettings } from './policy-settings.model.js';
import { env } from '../../config/env.js';

export class PolicySettingsRepository {
  async getSettings(): Promise<IPolicySettings> {
    let settings = await PolicySettingsModel.findOne({ key: 'global' }).exec();
    if (!settings) {
      settings = await PolicySettingsModel.create({
        key: 'global',
        maxPaymentRetries: env.POLICY_MAX_PAYMENT_RETRIES,
        maxCustomerContacts: env.POLICY_MAX_CUSTOMER_CONTACTS,
        maxRecoveryWindowDays: env.POLICY_MAX_RECOVERY_WINDOW_DAYS,
        autoEscalation: env.POLICY_AUTO_ESCALATION,
        highValueThreshold: env.POLICY_HIGH_VALUE_THRESHOLD,
        aiConfidenceThreshold: env.POLICY_AI_CONFIDENCE_THRESHOLD,
      });
    }
    return settings;
  }

  async updateSettings(update: Partial<IPolicySettings>): Promise<IPolicySettings> {
    return PolicySettingsModel.findOneAndUpdate(
      { key: 'global' },
      { $set: update },
      { new: true, upsert: true }
    ).exec();
  }
}

