import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_SUPER_ADMIN_KEY } from '../decorators/super-admin.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/**
 * Enforces `@SuperAdmin()`. Registered globally so a route marked with the
 * decorator is protected wherever it lives — forgetting to wire a guard on a
 * new admin controller would otherwise expose every tenant's data.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresSuperAdmin = this.reflector.getAllAndOverride<boolean>(IS_SUPER_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiresSuperAdmin) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    if (!request.user?.isSuperAdmin) {
      throw new ForbiddenException('Super-admin access required');
    }

    return true;
  }
}
