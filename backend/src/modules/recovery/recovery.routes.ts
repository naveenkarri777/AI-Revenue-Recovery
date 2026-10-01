import { Router } from 'express';
import { RecoveryController } from './recovery.controller.js';
import { validateQuery, validateParams } from '../../shared/middleware/zod-validate.middleware.js';
import { ListCasesQuerySchema, CaseParamSchema } from './recovery.schema.js';

const router = Router();
const controller = new RecoveryController();

router.get('/', validateQuery(ListCasesQuerySchema), controller.list);
router.get('/stats', controller.stats);
router.get('/:id', validateParams(CaseParamSchema), controller.getById);
router.post('/:id/process', validateParams(CaseParamSchema), controller.process);
router.get('/:id/logs', validateParams(CaseParamSchema), controller.getLogs);

export const recoveryCaseRoutes = router;

