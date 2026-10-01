import { Router } from 'express';
import { PolicySettingsController } from './policy-settings.controller.js';

const router = Router();
const controller = new PolicySettingsController();

router.get('/', controller.getSettings);
router.put('/', controller.updateSettings);

export const policySettingsRoutes = router;

