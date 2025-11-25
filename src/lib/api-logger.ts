import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Extract user information from request
function extractUserInfo(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const email = request.headers.get('x-user-email');
  const userAgent = request.headers.get('user-agent') || '';
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';

  return { userId, email, userAgent, ip };
}

// Request logging middleware
export function requestLogger(request: NextRequest) {
  const requestId = generateRequestId();
  const { userId, email, userAgent, ip } = extractUserInfo(request);
  const start = Date.now();

  // Log incoming request
  logger.info(`${request.method} ${request.url}`, {
    context: 'api_request',
    requestId,
    userId,
    metadata: {
      method: request.method,
      url: request.url,
      userAgent,
      ip,
      email,
      headers: Object.fromEntries(request.headers.entries()),
    },
  });

  return { requestId, startTime: start };
}

// Response logging middleware
export function responseLogger(
  request: NextRequest,
  response: NextResponse,
  requestId: string,
  startTime: number
) {
  const duration = Date.now() - startTime;
  const { userId } = extractUserInfo(request);

  // Log response
  if (response.status >= 400) {
    logger.error(`API Error Response: ${request.method} ${request.url} - ${response.status}`, {
      context: 'api_response_error',
      requestId,
      userId,
      metadata: {
        method: request.method,
        url: request.url,
        status: response.status,
        statusText: response.statusText,
        duration,
        headers: Object.fromEntries(response.headers.entries()),
      },
    });
  } else {
    logger.info(`API Response: ${request.method} ${request.url} - ${response.status}`, {
      context: 'api_response',
      requestId,
      userId,
      metadata: {
        method: request.method,
        url: request.url,
        status: response.status,
        duration,
      },
    });
  }

  // Add request ID to response headers for debugging
  response.headers.set('x-request-id', requestId);
  response.headers.set('x-response-time', `${duration}ms`);

  return response;
}

// Error handling middleware
export function errorHandler(
  error: Error | any,
  request: NextRequest,
  requestId?: string
): NextResponse {
  const { userId, email, userAgent, ip } = extractUserInfo(request);

  // Determine error type and status
  let status = 500;
  let message = 'Internal Server Error';
  let errorType = 'unknown_error';

  if (error.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
    errorType = 'validation_error';
  } else if (error.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
    errorType = 'auth_error';
  } else if (error.name === 'ForbiddenError') {
    status = 403;
    message = 'Forbidden';
    errorType = 'authorization_error';
  } else if (error.name === 'NotFoundError') {
    status = 404;
    message = 'Not Found';
    errorType = 'not_found_error';
  } else if (error.name === 'PrismaClientKnownRequestError') {
    status = 400;
    message = 'Database Error';
    errorType = 'database_error';
  } else if (error.name === 'PrismaClientUnknownRequestError') {
    status = 500;
    message = 'Database Connection Error';
    errorType = 'database_connection_error';
  }

  // Log detailed error information
  logger.error(`API Error: ${errorType} - ${message}`, {
    context: 'api_error',
    requestId,
    userId,
    error,
    metadata: {
      errorType,
      status,
      message,
      url: request.url,
      method: request.method,
      userAgent,
      ip,
      email,
      stack: error.stack,
      // Include request body for debugging (be careful with sensitive data)
      requestBody: request.method !== 'GET' ? 
        JSON.stringify(request.body || {}, null, 2) : undefined,
    },
  });

  // Create error response
  const errorResponse = {
    error: message,
    errorType,
    requestId,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.message,
    }),
  };

  return NextResponse.json(errorResponse, { 
    status,
    headers: {
      'x-request-id': requestId || generateRequestId(),
      'x-error-type': errorType,
    },
  });
}

// Performance monitoring middleware
export function performanceLogger(
  request: NextRequest,
  requestId: string,
  startTime: number
) {
  const duration = Date.now() - startTime;
  const { userId } = extractUserInfo(request);

  // Log performance metrics
  if (duration > 5000) { // Slow requests (> 5 seconds)
    logger.warn(`Slow API Request: ${request.method} ${request.url}`, {
      context: 'api_performance',
      requestId,
      userId,
      metadata: {
        method: request.method,
        url: request.url,
        duration,
        threshold: 5000,
      },
    });
  } else if (duration > 1000) { // Moderate requests (> 1 second)
    logger.info(`Moderate API Request: ${request.method} ${request.url}`, {
      context: 'api_performance',
      requestId,
      userId,
      metadata: {
        method: request.method,
        url: request.url,
        duration,
        threshold: 1000,
      },
    });
  }

  return duration;
}

// Database error logging
export function databaseLogger(
  operation: string,
  error: any,
  query?: string,
  table?: string,
  userId?: string,
  requestId?: string
) {
  logger.error(`Database Error: ${operation}`, {
    context: 'database',
    requestId,
    userId,
    error,
    metadata: {
      operation,
      query,
      table,
      errorName: error.name,
      errorCode: error.code,
      errorMeta: error.meta,
    },
  });
}

// Authentication error logging
export function authLogger(
  action: string,
  error: any,
  email?: string,
  ip?: string,
  requestId?: string
) {
  logger.error(`Authentication Error: ${action}`, {
    context: 'auth',
    requestId,
    error,
    metadata: {
      action,
      email,
      ip,
      errorName: error.name,
      errorCode: error.code,
    },
  });
}

// Business logic error logging
export function businessLogicLogger(
  operation: string,
  error: any,
  userId?: string,
  requestId?: string,
  additionalData?: Record<string, any>
) {
  logger.error(`Business Logic Error: ${operation}`, {
    context: 'business_logic',
    requestId,
    userId,
    error,
    metadata: {
      operation,
      errorName: error.name,
      errorCode: error.code,
      ...additionalData,
    },
  });
}

// Middleware wrapper for API routes
export function withLogging(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    const { requestId, startTime } = requestLogger(request);

    try {
      const response = await handler(request, context);
      
      // Log response and performance
      const duration = performanceLogger(request, requestId, startTime);
      return responseLogger(request, response, requestId, startTime);
      
    } catch (error) {
      // Handle and log errors
      return errorHandler(error, request, requestId);
    }
  };
}

// Rate limiting error logging
export function rateLimitLogger(
  identifier: string,
  limit: number,
  windowMs: number,
  ip?: string,
  requestId?: string
) {
  logger.warn(`Rate Limit Exceeded`, {
    context: 'rate_limit',
    requestId,
    metadata: {
      identifier,
      limit,
      windowMs,
      ip,
      timestamp: new Date().toISOString(),
    },
  });
}

// Security event logging
export function securityLogger(
  event: string,
  details: Record<string, any>,
  ip?: string,
  userId?: string,
  requestId?: string
) {
  logger.warn(`Security Event: ${event}`, {
    context: 'security',
    requestId,
    userId,
    metadata: {
      event,
      ip,
      timestamp: new Date().toISOString(),
      ...details,
    },
  });
}

// Export types for use in API routes
export interface RequestContext {
  requestId: string;
  startTime: number;
  userId?: string;
  email?: string;
  ip?: string;
}

// Helper to create context for API routes
export function createRequestContext(request: NextRequest): RequestContext {
  const { requestId, startTime } = requestLogger(request);
  const { userId, email, ip } = extractUserInfo(request);
  
  return {
    requestId,
    startTime,
    userId,
    email,
    ip,
  };
}