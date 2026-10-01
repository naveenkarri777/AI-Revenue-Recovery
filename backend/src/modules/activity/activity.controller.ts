import { Request, Response, NextFunction } from 'express';
import { ActivityService } from './activity.service.js';
import { ok } from '../../shared/utils/response.util.js';

export class ActivityController {
  constructor(private service = new ActivityService()) {}

  getFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Number(req.query.limit) || 20;
      const feed = await this.service.getActivityFeed(limit);
      res.status(200).json(ok(feed));
    } catch (err) {
      next(err);
    }
  };
}

