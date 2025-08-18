import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { MongoError } from 'mongodb';
import { logger } from '../utils/logger';
import { getClientIp } from '../utils/helpers';
import { IApiResponse } from '../types';

/**
 * Custom error class
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error handler wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create response helper
 */
export const createResponse = <T>(
  success: boolean,
  data?: T,
  message?: string,
  error?: string,
  extra?: any
): IApiResponse<T> => {
  const response: IApiResponse<T> = { success };
  
  if (data !== undefined) response.data = data;
  if (message) response.message = message;
  if (error) response.error = error;
  if (extra) Object.assign(response, extra);
  
  return response;
};

/**
 * Handle MongoDB duplicate key errors
 */
const handleDuplicateKeyError = (error: any): AppError => {
  const field = Object.keys(error.keyValue)[0];
  const value = error.keyValue[field];
  const message = `${field} '${value}' already exists. Please use a different ${field}.`;
  return new AppError(message, 400);
};

/**
 * Handle MongoDB validation errors
 */
const handleValidationError = (error: any): AppError => {
  const errors = Object.values(error.errors).map((err: any) => err.message);
  const message = `Validation failed: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Handle MongoDB cast errors
 */
const handleCastError = (error: any): AppError => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
};

/**
 * Handle JWT errors
 */
const handleJWTError = (): AppError => {
  return new AppError('Invalid token. Please log in again.', 401);
};

/**
 * Handle JWT expired errors
 */
const handleJWTExpiredError = (): AppError => {
  return new AppError('Token expired. Please log in again.', 401);
};

/**
 * Handle Multer errors
 */
const handleMulterError = (error: MulterError): AppError => {
  let message = 'File upload error';
  let statusCode = 400;

  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      message = 'File too large. Please upload a smaller file.';
      break;
    case 'LIMIT_FILE_COUNT':
      message = 'Too many files. Please upload fewer files.';
      break;
    case 'LIMIT_UNEXPECTED_FILE':
      message = 'Unexpected file field. Please check the file field name.';
      break;
    case 'LIMIT_PART_COUNT':
      message = 'Too many parts in the request.';
      break;
    case 'LIMIT_FIELD_KEY':
      message = 'Field name too long.';
      break;
    case 'LIMIT_FIELD_VALUE':
      message = 'Field value too long.';
      break;
    case 'LIMIT_FIELD_COUNT':
      message = 'Too many fields in the request.';
      break;
    default:
      if (error.code === 'MISSING_FIELD_NAME') {
        message = 'Missing field name for file upload.';
      } else {
        message = `File upload error: ${error.message}`;
      }
  }

  return new AppError(message, statusCode);
};

/**
 * Send error response for development
 */
const sendErrorDev = (err: AppError, req: Request, res: Response): void => {
  const clientIP = getClientIp(req);
  
  logger.error('Error occurred:', {
    error: err,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: clientIP,
    userAgent: req.get('User-Agent'),
    user: (req as any).user?.email || 'Anonymous'
  });

  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    stack: err.stack,
    details: {
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Send error response for production
 */
const sendErrorProd = (err: AppError, req: Request, res: Response): void => {
  const clientIP = getClientIp(req);

  // Log error details
  logger.error('Error occurred:', {
    message: err.message,
    statusCode: err.statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: clientIP,
    user: (req as any).user?.email || 'Anonymous'
  });

  // Operational errors: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } else {
    // Programming or unknown errors: don't leak error details
    logger.error('Non-operational error:', err);
    
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
};

/**
 * Global error handling middleware
 */
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.code === 11000) {
      error = handleDuplicateKeyError(err);
    }
    
    if (err.name === 'ValidationError') {
      error = handleValidationError(err);
    }
    
    if (err.name === 'CastError') {
      error = handleCastError(err);
    }
    
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    
    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }
    
    if (err instanceof MulterError) {
      error = handleMulterError(err);
    }

    sendErrorProd(error, req, res);
  }
};

/**
 * Handle 404 errors (unhandled routes)
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const message = `Route ${req.originalUrl} not found`;
  const error = new AppError(message, 404);
  next(error);
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught Exception! Shutting down...', err);
    process.exit(1);
  });
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (err: Error) => {
    logger.error('Unhandled Rejection! Shutting down...', err);
    process.exit(1);
  });
};

/**
 * Validation error handler
 */
export const validationErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error: any) => ({
      field: error.path,
      message: error.message
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'Please check your input data',
      errors
    });
    return;
  }

  next(err);
};

/**
 * Database connection error handler
 */
export const databaseErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof MongoError) {
    logger.error('Database error:', err);
    
    res.status(500).json({
      success: false,
      message: 'Database operation failed. Please try again later.'
    });
    return;
  }

  next(err);
};

/**
 * Rate limit error handler
 */
export const rateLimitErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err.statusCode === 429) {
    const clientIP = getClientIp(req);
    logger.warn(`Rate limit exceeded for IP ${clientIP} on ${req.originalUrl}`);
    
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      error: 'Rate limit exceeded'
    });
    return;
  }

  next(err);
};

/**
 * Create error for specific HTTP status codes
 */
export const createError = (message: string, statusCode: number = 500): AppError => {
  return new AppError(message, statusCode);
};

/**
 * Create validation error
 */
export const createValidationError = (message: string): AppError => {
  return new AppError(message, 400);
};

/**
 * Create authentication error
 */
export const createAuthError = (message: string = 'Authentication failed'): AppError => {
  return new AppError(message, 401);
};

/**
 * Create authorization error
 */
export const createAuthorizationError = (message: string = 'Access denied'): AppError => {
  return new AppError(message, 403);
};

/**
 * Create not found error
 */
export const createNotFoundError = (resource: string = 'Resource'): AppError => {
  return new AppError(`${resource} not found`, 404);
};

/**
 * Create conflict error
 */
export const createConflictError = (message: string): AppError => {
  return new AppError(message, 409);
};

/**
 * Create server error
 */
export const createServerError = (message: string = 'Internal server error'): AppError => {
  return new AppError(message, 500);
};
