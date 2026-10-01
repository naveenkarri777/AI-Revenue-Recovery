import { Router } from 'express';
import { RevenueEventController } from './revenue-event.controller.js';
import { validateBody, validateQuery } from '../../shared/middleware/zod-validate.middleware.js';
import { IngestRevenueEventSchema, ListRevenueEventsQuerySchema } from './revenue-event.schema.js';

const router = Router();
const controller = new RevenueEventController();

router.post('/', validateBody(IngestRevenueEventSchema), controller.ingest);
router.get('/', validateQuery(ListRevenueEventsQuerySchema), controller.list);
router.get('/:id', controller.getById);

export const revenueEventRoutes = router;

