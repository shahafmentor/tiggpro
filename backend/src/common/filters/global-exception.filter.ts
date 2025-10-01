import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import type { ApiResponse } from '@tiggpro/shared';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, error } = this.getErrorDetails(exception);

    // Log the error
    this.logError(exception, request, status);

    // Prepare error response
    const errorResponse: ApiResponse = {
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && {
        details: {
          path: request.url,
          method: request.method,
          timestamp: new Date().toISOString(),
          ...(error && { stack: error }),
        },
      }),
    };

    response.status(status).json(errorResponse);
  }

  private getErrorDetails(exception: unknown): {
    status: number;
    message: string;
    error?: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return { status, message: response };
      }

      if (typeof response === 'object' && response !== null) {
        const errorObj = response as {
          message?: string | string[];
          error?: string;
        };
        const errorMessage = Array.isArray(errorObj.message)
          ? errorObj.message.join(', ')
          : errorObj.message || errorObj.error || 'Unknown error';
        return {
          status,
          message: errorMessage,
          error:
            process.env.NODE_ENV === 'development'
              ? exception.stack
              : undefined,
        };
      }
    }

    // Handle non-HTTP exceptions
    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          process.env.NODE_ENV === 'development'
            ? exception.message
            : 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? exception.stack : undefined,
      };
    }

    // Handle unknown exceptions
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Unknown error occurred',
    };
  }

  private logError(exception: unknown, request: Request, status: number): void {
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || '';

    if (status >= 500) {
      this.logger.error(
        `💥 ${method} ${url} - ${status} - ${ip} - ${userAgent}`,
        exception instanceof Error ? exception.stack : exception,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `⚠️  ${method} ${url} - ${status} - ${ip} - ${userAgent}`,
        exception instanceof Error ? exception.message : exception,
      );
    }
  }
}
