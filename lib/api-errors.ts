import { NextResponse } from 'next/server';

export interface ApiError {
  error: string;
  message: string;
  details?: any;
  code?: string;
}

/**
 * Create a consistent error response
 */
export function errorResponse(
  error: string,
  message: string,
  status: number = 500,
  details?: any
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error,
      message,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Authentication error (401)
 */
export function authenticationError(message: string = 'Authentication required') {
  return errorResponse('Unauthorized', message, 401);
}

/**
 * Authorization error (403)
 */
export function authorizationError(message: string = 'Access denied') {
  return errorResponse('Forbidden', message, 403);
}

/**
 * Validation error (400)
 */
export function validationError(message: string, details?: any) {
  return errorResponse('Validation Error', message, 400, details);
}

/**
 * Not found error (404)
 */
export function notFoundError(message: string = 'Resource not found') {
  return errorResponse('Not Found', message, 404);
}

/**
 * Rate limit error (429)
 */
export function rateLimitError(message: string = 'Too many requests') {
  return errorResponse('Rate Limit Exceeded', message, 429);
}

/**
 * Server error (500)
 */
export function serverError(message: string = 'Internal server error', details?: any) {
  return errorResponse('Server Error', message, 500, details);
}

/**
 * Success response
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: any, context: string = 'API') {
  console.error(`[${context}] Error:`, error);

  if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
    return authenticationError(error.message);
  }

  if (error.message?.includes('not found') || error.message?.includes('404')) {
    return notFoundError(error.message);
  }

  if (error.message?.includes('validation') || error.message?.includes('invalid')) {
    return validationError(error.message);
  }

  return serverError(
    error.message || 'An unexpected error occurred',
    process.env.NODE_ENV === 'development' ? error.stack : undefined
  );
}
