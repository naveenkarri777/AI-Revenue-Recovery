import { Router } from 'express';
import { DemoController } from './demo.controller.js';

const router = Router();
const controller = new DemoController();

router.post('/run-batch', controller.runBatch);

export const demoRoutes = router;

