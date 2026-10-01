import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service.js';
import { ok } from '../../shared/utils/response.util.js';

export class DashboardController {
  constructor(private service = new DashboardService()) {}

  getDashboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getDashboardData();
      res.status(200).json(ok(data));
    } catch (err) {
      next(err);
    }
  };
}

