import { Request, Response, NextFunction } from 'express';
import { DemoService } from './demo.service.js';
import { ok } from '../../shared/utils/response.util.js';

export class DemoController {
  constructor(private service = new DemoService()) {}

  runBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const batchSize = req.body?.batchSize || 20;
      const result = await this.service.runBatchSimulation(batchSize);
      res.status(200).json(ok(result, `Batch simulation of ${batchSize} cases completed successfully`));
    } catch (err) {
      next(err);
    }
  };
}

