import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/** Where a request came from, for the audit trail. */
export interface ClientInfo {
  ip: string | null;
  userAgent: string | null;
}

/**
 * Extracts the caller's IP and user agent.
 *
 * Passed explicitly into the services that audit, rather than plucked from a
 * global: the alternative is async-local-storage, and a request context that
 * silently returns undefined when a caller forgot to set it is worse than a
 * parameter the compiler insists on.
 */
export const Client = createParamDecorator((_data: unknown, ctx: ExecutionContext): ClientInfo => {
  const request = ctx.switchToHttp().getRequest<Request>();

  return {
    // `request.ip` honours Express's trust-proxy setting; behind a load balancer
    // that must be configured or every row records the balancer's address.
    ip: request.ip ?? request.socket?.remoteAddress ?? null,
    userAgent: request.get('user-agent') ?? null,
  };
});
