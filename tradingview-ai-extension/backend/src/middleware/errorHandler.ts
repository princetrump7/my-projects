import type { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
  details?: unknown
}

/**
 * Global error handler middleware.
 * Catches unhandled errors and returns structured JSON responses.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(`[error] ${err.message}`, err.details ?? '')

  const statusCode = err.statusCode ?? 500
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    status: statusCode,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  })
}

/**
 * Creates an AppError with a status code.
 */
export function createError(message: string, statusCode: number, details?: unknown): AppError {
  const error = new Error(message) as AppError
  error.statusCode = statusCode
  error.details = details
  return error
}
