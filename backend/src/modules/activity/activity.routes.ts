import { Router } from 'express';
import { ActivityController } from './activity.controller.js';

const router = Router();
const controller = new ActivityController();

router.get('/', controller.getFeed);

export const activityRoutes = router;

