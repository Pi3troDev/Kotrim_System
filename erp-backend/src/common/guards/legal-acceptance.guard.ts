import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { LegalAcceptanceService } from '../../modules/legal/legal-acceptance.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_LEGAL_CHECK_KEY } from '../decorators/skip-legal-check.decorator';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/**
 * Registered globally (see app.module.ts), right after ImpersonationReadOnlyGuard.
 * Blocks every route once the platform publishes a newer Terms of Use or
 * Privacy Policy than the caller has accepted — this is what turns "future
 * updates to the terms" into an enforced state instead of a page nobody is
 * ever pointed back to.
 *
 * Answers **403 / LEGAL_ACCEPTANCE_REQUIRED**: the frontend interceptor shows
 * a blocking dialog with the new text and an accept button, then retries.
 */
@Injectable()
export class LegalAcceptanceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly acceptance: LegalAcceptanceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const exempt = this.reflector.getAllAndOverride<boolean>(SKIP_LEGAL_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (exempt) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) {
      return true;
    }

    // Kotrim staff never consent here. A session impersonating a customer must
    // not be blocked — or made to silently "consent" — on that customer's
    // behalf; impersonation is already read-only regardless of this guard.
    if (user.isSuperAdmin || user.impersonatedBy) {
      return true;
    }

    const hasPending = await this.acceptance.hasPending(user.id);
    if (!hasPending) {
      return true;
    }

    throw new ForbiddenException({
      statusCode: 403,
      error: 'LEGAL_ACCEPTANCE_REQUIRED',
      message: 'Os Termos de Uso ou a Política de Privacidade foram atualizados. Revise e aceite para continuar.',
    });
  }
}
