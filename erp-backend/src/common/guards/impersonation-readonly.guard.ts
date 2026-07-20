import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/** The only writes an impersonated session may perform: ending itself. */
const ALWAYS_ALLOWED_PATHS = ['/admin/impersonate/end', '/auth/logout'];

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Makes an impersonated session read-only.
 *
 * Registered globally, after JwtAuthGuard.
 *
 * Support needs to *see* what a customer sees. It does not need to write into
 * their books — and if it could, an accidental click would create or delete a
 * real workshop's data under that workshop's own name, with only an audit row
 * to explain it afterwards. Read-only is the safe default here; every write
 * being audited with `superAdminId` is what would make relaxing it defensible
 * later, if reproducing a bug ever genuinely requires it.
 */
@Injectable()
export class ImpersonationReadOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user?.impersonatedBy) {
      return true;
    }

    if (READ_METHODS.has(request.method)) {
      return true;
    }

    if (ALWAYS_ALLOWED_PATHS.some((path) => request.path.endsWith(path))) {
      return true;
    }

    throw new ForbiddenException({
      statusCode: 403,
      error: 'IMPERSONATION_READ_ONLY',
      message:
        'Você está visualizando esta empresa como suporte. Sessões de suporte são somente leitura — ' +
        'saia da visualização para agir na sua própria conta.',
    });
  }
}
