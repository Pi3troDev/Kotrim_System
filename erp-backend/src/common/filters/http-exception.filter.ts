import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/** Fields this filter computes itself; a thrower cannot override them. */
const RESERVED_KEYS = new Set(['statusCode', 'message', 'path', 'timestamp']);

/** Normalizes every error response into a single predictable shape. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as { message?: string | string[] }).message ?? exceptionResponse);

    // Anything else the thrower attached rides along — `error:
    // 'SUBSCRIPTION_REQUIRED'` (402), `error: 'PLAN_UPGRADE_REQUIRED'` +
    // `feature` (403), and whatever a future guard needs.
    //
    // Generic rather than a per-field allowlist: the first version of this
    // normalization silently swallowed a machine-readable code that a guard was
    // carefully setting, and special-casing one key at a time just moves the
    // next silent drop further down the road.
    const extra =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? Object.fromEntries(
            Object.entries(exceptionResponse).filter(([key]) => !RESERVED_KEYS.has(key)),
          )
        : {};

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...extra,
      message,
    });
  }
}
