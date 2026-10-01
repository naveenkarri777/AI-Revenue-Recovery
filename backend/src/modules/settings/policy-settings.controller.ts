import { Request, Response, NextFunction } from 'express';
import { PolicySettingsService } from './policy-settings.service.js';
import { ok } from '../../shared/utils/response.util.js';

export class PolicySettingsController {
  constructor(private service = new PolicySettingsService()) {}

  getSettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await this.service.getSettings();
      res.status(200).json(
        ok({
          maxPaymentRetries: settings.maxPaymentRetries,
          maxCustomerContacts: settings.maxCustomerContacts,
          maxRecoveryWindowDays: settings.maxRecoveryWindowDays,
          autoEscalation: settings.autoEscalation,
          highValueThreshold: settings.highValueThreshold,
          aiConfidenceThreshold: settings.aiConfidenceThreshold,
        })
      );
    } catch (err) {
      next(err);
    }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updated = await this.service.updateSettings(req.body);
      res.status(200).json(
        ok(
          {
            maxPaymentRetries: updated.maxPaymentRetries,
            maxCustomerContacts: updated.maxCustomerContacts,
            maxRecoveryWindowDays: updated.maxRecoveryWindowDays,
            autoEscalation: updated.autoEscalation,
            highValueThreshold: updated.highValueThreshold,
            aiConfidenceThreshold: updated.aiConfidenceThreshold,
          },
          'Policy settings updated successfully'
        )
      );
    } catch (err) {
      next(err);
    }
  };
}

