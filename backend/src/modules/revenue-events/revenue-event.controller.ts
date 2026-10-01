import { Request, Response, NextFunction } from 'express';
import { RevenueEventService } from './revenue-event.service.js';
import { ok, paginated } from '../../shared/utils/response.util.js';

export class RevenueEventController {
  constructor(private service = new RevenueEventService()) {}

  ingest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.ingestEvent(req.body);
      res.status(201).json(ok(result, 'Revenue event ingested successfully'));
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const filter: Record<string, unknown> = {};
      if (req.query.status) {
        filter.status = req.query.status;
      }

      const skip = (page - 1) * limit;
      const [items, total] = await this.service.getEvents(filter, skip, limit);

      res.status(200).json(paginated(items, total, page, limit));
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const event = await this.service.getEventById(id);
      if (!event) {
        res.status(404).json({ success: false, message: 'Event not found' });
        return;
      }
      res.status(200).json(ok(event));
    } catch (err) {
      next(err);
    }
  };
}
