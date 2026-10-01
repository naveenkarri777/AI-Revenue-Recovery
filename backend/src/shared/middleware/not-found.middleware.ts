import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors/error-types.js';

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Path '${req.originalUrl}' with method '${req.method}' not found`));
}

