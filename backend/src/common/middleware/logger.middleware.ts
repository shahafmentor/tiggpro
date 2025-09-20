import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl: url } = request;
    const userAgent = request.get('User-Agent') || '';
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(`➡️  ${method} ${url} - ${ip} - ${userAgent}`);

    response.on('close', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');
      const responseTime = Date.now() - startTime;

      // Determine log level based on status code
      const logLevel = this.getLogLevel(statusCode);
      const emoji = this.getStatusEmoji(statusCode);

      this.logger[logLevel](
        `⬅️  ${emoji} ${method} ${url} ${statusCode} ${contentLength || 0}b - ${responseTime}ms - ${ip}`,
      );
    });

    next();
  }

  private getLogLevel(statusCode: number): 'log' | 'warn' | 'error' {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'log';
  }

  private getStatusEmoji(statusCode: number): string {
    if (statusCode >= 500) return '💥';
    if (statusCode >= 400) return '⚠️';
    if (statusCode >= 300) return '↩️';
    return '✅';
  }
}
