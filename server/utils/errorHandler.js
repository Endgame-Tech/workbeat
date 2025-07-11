// Comprehensive error handling utility
class AppError extends Error {
  constructor(message, statusCode, errorCode = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, 'DATABASE_ERROR', originalError?.message);
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message) {
    super(`External service error: ${service} - ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
  }
}

// Error response formatter
const formatErrorResponse = (error, includeStack = false) => {
  const response = {
    success: false,
    error: {
      message: error.message,
      code: error.errorCode || 'UNKNOWN_ERROR',
      timestamp: error.timestamp || new Date().toISOString(),
      ...(error.details && { details: error.details })
    }
  };

  // Include stack trace in development
  if (includeStack && process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  return response;
};

// Global error handler middleware
const globalErrorHandler = (error, req, res, next) => {
  // Log error details
  console.error('🚨 Error occurred:', {
    message: error.message,
    statusCode: error.statusCode,
    errorCode: error.errorCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    stack: error.stack
  });

  // Handle specific error types
  let appError = error;

  // Convert known errors to AppError instances
  if (error.name === 'ValidationError') {
    appError = new ValidationError(error.message, error.details);
  } else if (error.name === 'CastError') {
    appError = new ValidationError('Invalid data format');
  } else if (error.code === 11000) {
    // MongoDB duplicate key error
    appError = new ConflictError('Duplicate entry detected');
  } else if (error.name === 'JsonWebTokenError') {
    appError = new AuthenticationError('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    appError = new AuthenticationError('Token expired');
  } else if (error.code === 'P2002') {
    // Prisma unique constraint error
    appError = new ConflictError('Duplicate entry detected');
  } else if (error.code === 'P2025') {
    // Prisma record not found
    appError = new NotFoundError('Record');
  } else if (!error.isOperational) {
    // Unknown operational error
    appError = new AppError('Something went wrong', 500, 'INTERNAL_SERVER_ERROR');
  }

  // Send error response
  res.status(appError.statusCode || 500).json(
    formatErrorResponse(appError, true)
  );
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Try-catch wrapper for services
const tryCatch = async (operation, errorMessage = 'Operation failed') => {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    
    // Re-throw as AppError if not already
    if (error instanceof AppError) {
      throw error;
    }
    
    // Convert database errors
    if (error.code?.startsWith('P')) {
      throw new DatabaseError(errorMessage, error);
    }
    
    // Generic error
    throw new AppError(errorMessage, 500, 'OPERATION_ERROR', error.message);
  }
};

// Validation result handler
const handleValidationError = (validationResult) => {
  if (!validationResult.success) {
    const errors = validationResult.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
    
    throw new ValidationError('Validation failed', errors);
  }
  return validationResult.data;
};

// Database operation wrapper
const dbOperation = async (operation, errorMessage = 'Database operation failed') => {
  return tryCatch(operation, errorMessage);
};

// Success response formatter
const successResponse = (data, message = 'Operation successful', meta = {}) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    ...meta
  };
};

// Pagination response formatter
const paginatedResponse = (data, pagination, message = 'Data retrieved successfully') => {
  return {
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString()
  };
};

// Not found handler middleware
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

// Unhandled promise rejection handler
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Promise Rejection:', reason);
    console.error('Promise:', promise);
    
    // In production, you might want to restart the server
    if (process.env.NODE_ENV === 'production') {
      console.error('🔄 Gracefully shutting down due to unhandled promise rejection');
      process.exit(1);
    }
  });
};

// Uncaught exception handler
const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    
    // In production, restart the server
    if (process.env.NODE_ENV === 'production') {
      console.error('🔄 Shutting down due to uncaught exception');
      process.exit(1);
    }
  });
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  
  // Error handlers
  globalErrorHandler,
  notFoundHandler,
  asyncHandler,
  tryCatch,
  dbOperation,
  handleValidationError,
  
  // Response formatters
  successResponse,
  paginatedResponse,
  formatErrorResponse,
  
  // Process handlers
  handleUnhandledRejection,
  handleUncaughtException
};