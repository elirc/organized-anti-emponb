import { ErrorCode } from './errorCodes';

export class AppError extends Error {
  public readonly errorCode: ErrorCode;
  public readonly statusCode: number;
  public readonly metadata?: any;

  constructor(errorCode: ErrorCode, statusCode: number, message: string, metadata?: any) {
    super(message);
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.metadata = metadata;
    
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, AppError.prototype);
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
