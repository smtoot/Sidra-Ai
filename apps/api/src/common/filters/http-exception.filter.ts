import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global Exception Filter
 *
 * SECURITY: Sanitizes all error responses to prevent information leakage.
 * - Hides stack traces from client responses
 * - Masks internal error details (database, file paths, etc.)
 * - Returns consistent error format
 * - Logs full error details server-side for debugging
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred';
    let errorCode = 'INTERNAL_ERROR';

    // Handle known HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || message;
        errorCode = (responseObj.error as string) || this.getErrorCode(status);

        // Handle validation errors (class-validator)
        if (Array.isArray(responseObj.message)) {
          message = responseObj.message.join(', ');
        }
      }

      errorCode = this.getErrorCode(status);
    } else if (exception instanceof Error) {
      // Handle unknown errors - sanitize message
      message = this.sanitizeErrorMessage(exception.message);

      // Log full error for debugging (server-side only)
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
        {
          path: request.url,
          method: request.method,
          userId: (request as any).user?.userId,
        },
      );
    }

    // Log all errors for monitoring
    if (status >= 500) {
      this.logger.error(
        `[${status}] ${request.method} ${request.url} - ${message}`,
        {
          errorCode,
          userId: (request as any).user?.userId,
        },
      );
    } else if (status >= 400) {
      this.logger.warn(
        `[${status}] ${request.method} ${request.url} - ${message}`,
        {
          errorCode,
          userId: (request as any).user?.userId,
        },
      );
    }

    // Return sanitized response
    response.status(status).json({
      statusCode: status,
      error: errorCode,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  /**
   * Map HTTP status codes to error codes
   */
  private getErrorCode(status: number): string {
    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };
    return errorCodes[status] || 'UNKNOWN_ERROR';
  }

  /**
   * Sanitize error messages to prevent information leakage
   * SECURITY: Removes internal details like file paths, database info, etc.
   */
  private sanitizeErrorMessage(message: string): string {
    // Check for Prisma database errors
    if (message.includes('prisma') || message.includes('P2')) {
      if (message.includes('P2002')) {
        return 'A record with this value already exists';
      }
      if (message.includes('P2025')) {
        return 'Record not found';
      }
      if (message.includes('P2003')) {
        return 'Operation failed due to related records';
      }
      return 'Database operation failed';
    }

    // Check for file system errors
    if (message.includes('ENOENT') || message.includes('EACCES')) {
      return 'File operation failed';
    }

    // Check for network errors
    if (message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT')) {
      return 'Service temporarily unavailable';
    }

    // Check for AWS/R2 errors
    if (
      message.includes('S3') ||
      message.includes('R2') ||
      message.includes('AWS')
    ) {
      return 'Storage operation failed';
    }

    // Check for sensitive path information
    if (
      message.includes('/app/') ||
      message.includes('/Users/') ||
      message.includes('node_modules')
    ) {
      return 'An unexpected error occurred';
    }

    // Return original message if it appears safe
    // Limit length to prevent overly long error messages
    if (message.length > 200) {
      return message.substring(0, 200) + '...';
    }

    return message;
  }
}
