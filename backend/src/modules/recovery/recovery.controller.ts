import { Request, Response, NextFunction } from 'express';
import { RecoveryService } from './recovery.service.js';
import { RecoveryCaseRepository } from './recovery-case.repository.js';
import { ok } from '../../shared/utils/response.util.js';

export class RecoveryController {
  constructor(
    private service = new RecoveryService(),
    private caseRepo = new RecoveryCaseRepository()
  ) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { query, status, risk } = req.query as { query?: string; status?: string; risk?: string };
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;

      const result = await this.service.listCases({ query, status, risk }, page, pageSize);
      const stats = await this.caseRepo.getStatusStats();

      res.status(200).json(ok(result, undefined, { stats }));
    } catch (err) {
      next(err);
    }
  };

  stats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.caseRepo.getStatusStats();
      res.status(200).json(ok(stats));
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getCaseById(id);
      res.status(200).json(ok(result));
    } catch (err) {
      next(err);
    }
  };

  process = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.processCase(id);
      res.status(200).json(ok(result, `Case #${id} processed successfully`));
    } catch (err) {
      next(err);
    }
  };

  getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const logs = await this.service.getCaseAuditLogs(id);
      res.status(200).json(ok(logs));
    } catch (err) {
      next(err);
    }
  };
}
