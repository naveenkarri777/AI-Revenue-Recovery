import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app.error.js';
import { logger } from '../utils/logger.js';

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = req.id;

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: err.flatten(),
      },
      requestId,
    });
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[${requestId}] Operational Server Error: ${err.message}`, err);
    } else {
      logger.warn(`[${requestId}] Client Error (${err.statusCode}): ${err.message}`);
    }

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.code,
        details: err.details,
      },
      requestId,
    });
    return;
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid resource identifier',
      error: {
        code: 'INVALID_ID',
        details: (err as unknown as { message: string }).message,
      },
      requestId,
    });
    return;
  }

  logger.error(`[${requestId}] Unhandled Exception: ${err.message}`, err);

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
    },
    requestId,
  });
}

