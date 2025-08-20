import { Request, Response, NextFunction } from 'express';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle Mongoose validation errors
const handleValidationError = (error: any): AppError => {
  const errors = Object.values(error.errors).map((err: any) => ({
    field: err.path,
    message: err.message
  }));

  return new AppError('Validation failed', 400, errors);
};

// Handle Mongoose duplicate key errors
const handleDuplicateKeyError = (error: any): AppError => {
  const field = Object.keys(error.keyValue)[0];
  const value = error.keyValue[field];
  
  const details = [{
    field,
    message: `${field} already exists`
  }];

  return new AppError(`Duplicate value for ${field}: ${value}`, 400, details);
};

// Handle Mongoose cast errors
const handleCastError = (error: any): AppError => {
  const details = [{
    field: error.path,
    message: `Invalid ${error.path}`
  }];

  return new AppError(`Invalid ${error.path}: ${error.value}`, 400, details);
};

// Handle JWT errors
const handleJWTError = (): AppError => {
  return new AppError('Invalid token. Please log in again.', 401);
};

// Handle JWT expired errors
const handleJWTExpiredError = (): AppError => {
  return new AppError('Your token has expired. Please log in again.', 401);
};

// Handle Multer errors
const handleMulterError = (err: any): AppError => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File too large', 400);
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files', 400);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected file field', 400);
  }
  return new AppError(`File upload error: ${err.message}`, 400);
};

// Handle rate limit errors
const handleRateLimitError = (): AppError =>
  new AppError('Too many requests from this IP, please try again later.', 429);

// Send error response in development
const sendErrorDev = (err: any, res: Response) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
    errors: err.details || err.errors || []
  });
};

// Send error response in production
const sendErrorProd = (err: any, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details && { errors: err.details })
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }
};

// Global error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'ValidationError') {
      error = handleValidationError(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateKeyError(error);
    }
    if (error.name === 'CastError') {
      error = handleCastError(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }
    if (error.name === 'MulterError') {
      error = handleMulterError(error);
    }
    if (error.name === 'RateLimitError') {
      error = handleRateLimitError();
    }

    sendErrorProd(error, res);
  }
};

// Async error wrapper
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// 404 handler
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(err);
};

// Validation error helper
export const createValidationError = (field: string, message: string) => {
  const error = new AppError('Validation failed', 400);
  (error as any).errors = [{ field, message }];
  return error;
};

// Unauthorized error helper
export const createUnauthorizedError = (message: string = 'Unauthorized') => {
  return new AppError(message, 401);
};

// Forbidden error helper
export const createForbiddenError = (message: string = 'Forbidden') => {
  return new AppError(message, 403);
};

// Not found error helper
export const createNotFoundError = (resource: string = 'Resource') => {
  return new AppError(`${resource} not found`, 404);
};

// Conflict error helper
export const createConflictError = (message: string) => {
  return new AppError(message, 409);
};