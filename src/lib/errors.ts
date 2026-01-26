/**
 * Custom Error Classes for Better Error Handling
 * Provides structured error types for different failure scenarios
 */

export enum ErrorCode {
  // API Errors
  API_REQUEST_FAILED = 'API_REQUEST_FAILED',
  API_TIMEOUT = 'API_TIMEOUT',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  
  // Analysis Errors
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  
  // Authentication Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Service Errors
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export class APIError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorCode.API_REQUEST_FAILED, 500, true, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorCode.INVALID_INPUT, 400, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, ErrorCode.UNAUTHORIZED, 401, true);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Rate limit exceeded', ErrorCode.API_RATE_LIMIT, 429, true, {
      retryAfter,
    });
  }
}

/**
 * Error Handler Utility
 * Provides consistent error handling across the application
 */
export class ErrorHandler {
  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: unknown): string {
    if (error instanceof AppError) {
      return error.message;
    }

    if (error instanceof Error) {
      // Map common errors to user-friendly messages
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return 'Network connection failed. Please check your internet connection.';
      }
      if (error.message.includes('timeout')) {
        return 'Request timed out. Please try again.';
      }
      if (error.message.includes('rate limit')) {
        return 'Too many requests. Please wait a moment before trying again.';
      }
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Log error with context
   */
  static log(error: unknown, context?: string): void {
    const prefix = context ? `[${context}]` : '';
    
    if (error instanceof AppError) {
      console.error(`${prefix} ${error.name}:`, {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
      });
    } else if (error instanceof Error) {
      console.error(`${prefix} Error:`, error.message, error.stack);
    } else {
      console.error(`${prefix} Unknown error:`, error);
    }
  }

  /**
   * Determine if error is retryable
   */
  static isRetryable(error: unknown): boolean {
    if (error instanceof AppError) {
      return [
        ErrorCode.API_TIMEOUT,
        ErrorCode.NETWORK_ERROR,
        ErrorCode.SERVICE_UNAVAILABLE,
      ].includes(error.code);
    }

    if (error instanceof Error) {
      const retryablePatterns = [
        /timeout/i,
        /network/i,
        /ECONNREFUSED/i,
        /ETIMEDOUT/i,
      ];
      return retryablePatterns.some(pattern => pattern.test(error.message));
    }

    return false;
  }

  /**
   * Create appropriate error from unknown error type
   */
  static normalize(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        return new AuthenticationError();
      }
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return new RateLimitError();
      }
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return new AppError(
          'Network connection failed',
          ErrorCode.NETWORK_ERROR,
          0,
          true
        );
      }
      
      return new APIError(error.message);
    }

    return new AppError(
      'An unexpected error occurred',
      ErrorCode.UNKNOWN_ERROR,
      500,
      false
    );
  }
}
