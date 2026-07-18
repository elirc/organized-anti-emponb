import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
import { ErrorCodes } from '../shared/errors/errorCodes';
import { ZodError } from 'zod';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the full error to console for easy development and debugging
  console.error(`[Error] ${req.method} ${req.url} - `, err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      errorCode: err.errorCode,
      message: err.message,
      metadata: err.metadata,
    });
  }

  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    return res.status(400).json({
      success: false,
      errorCode: ErrorCodes.VALIDATION_ERROR,
      message: 'Validation failed',
      errors: fieldErrors,
    });
  }

  // Handle default server errors
  return res.status(500).json({
    success: false,
    errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error occurred' : err.message,
  });
};

export default errorMiddleware;
