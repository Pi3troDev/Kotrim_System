import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ClientInfo } from '../../common/decorators/client-info.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

/**
 * How long a support session lasts.
 *
 * Deliberately short and deliberately not refreshable: an impersonation token
 * that could be renewed would be indistinguishable from a permanent back door
 * into a customer's account. It expires and support starts a fresh, freshly
 * audited one.
 */
const IMPERSONATION_TTL = '30m';

export interface ImpersonationSession {
  accessToken: string;
  expiresInMinutes: number;
  company: { id: string; name: string };
  user: { id: string; name: string; email: string; role: string };
}

/**
 * "View as customer" for support.
 *
 * The security model, in order of importance:
 *
 * 1. Only a real super-admin can start one — enforced by `@SuperAdmin()` on the
 *    controller *and* re-checked here, because the check that matters most is
 *    the one that does not depend on a decorator being remembered.
 * 2. The issued token carries `impersonatedBy`, which makes JwtStrategy force
 *    `isSuperAdmin` off. An impersonated session therefore cannot reach the
 *    admin panel, cannot cross tenants, and cannot start another impersonation.
 * 3. It is read-only (`ImpersonationReadOnlyGuard`).
 * 4. Both ends are audited, with the staff member's id, IP and user agent.
 * 5. No refresh token is issued. The staff member's own refresh cookie is never
 *    touched, so leaving is just "stop using this token" — their real session is
 *    still there, untouched, underneath.
 */
@Injectable()
export class ImpersonationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async start(companyId: string, actor: AuthenticatedUser, client?: ClientInfo): Promise<ImpersonationSession> {
    this.assertRealSuperAdmin(actor);

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // The company's own admin — the oldest active user, the one created at
    // signup. Impersonating a specific employee would be a different feature;
    // support wants the view with the most access.
    const target = await this.prisma.user.findFirst({
      where: { companyId, deletedAt: null, isActive: true },
      orderBy: { createdAt: 'asc' },
      include: { role: { select: { name: true } } },
    });
    if (!target) {
      throw new BadRequestException('Esta empresa não tem nenhum usuário ativo para visualizar.');
    }

    // Refusing to impersonate staff is not paranoia: it is the one path that
    // would let a compromised super-admin account borrow another's identity and
    // muddy the audit trail about which of them did what.
    if (target.isSuperAdmin) {
      throw new ForbiddenException('Não é possível visualizar a conta de um super-admin.');
    }

    const accessToken = await this.jwtService.signAsync(
      {
        sub: target.id,
        companyId: target.companyId,
        roleId: target.roleId,
        email: target.email,
        impersonatedBy: actor.id,
      },
      {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: IMPERSONATION_TTL,
      },
    );

    // Awaited, not fire-and-forget: the session must not begin unless the
    // record of it beginning has landed. This is the one audit row worth
    // failing the request over.
    await this.auditService.recordAndWait({
      action: AuditAction.IMPERSONATION_STARTED,
      entity: 'Company',
      entityId: company.id,
      companyId: company.id,
      userId: target.id,
      superAdminId: actor.id,
      changes: { targetEmail: target.email, companyName: company.name, ttl: IMPERSONATION_TTL },
      client,
    });

    return {
      accessToken,
      expiresInMinutes: 30,
      company,
      user: { id: target.id, name: target.name, email: target.email, role: target.role.name },
    };
  }

  /**
   * Closes the session in the record.
   *
   * Called with the *impersonated* token still in hand, so `actor` is the
   * customer's identity and `actor.impersonatedBy` names the staff member. The
   * token itself is not revoked — it is short-lived and the client discards it;
   * this exists so the trail has a closing bracket.
   */
  async end(actor: AuthenticatedUser, client?: ClientInfo): Promise<{ ok: true }> {
    if (!actor.impersonatedBy) {
      throw new BadRequestException('Esta sessão não é uma visualização de suporte.');
    }

    await this.auditService.recordAndWait({
      action: AuditAction.IMPERSONATION_ENDED,
      entity: 'Company',
      entityId: actor.companyId,
      companyId: actor.companyId,
      userId: actor.id,
      superAdminId: actor.impersonatedBy,
      client,
    });

    return { ok: true };
  }

  /**
   * Defence in depth, not novelty.
   *
   * `@SuperAdmin()` already guards the route and JwtStrategy re-reads the user
   * from the database on every request, so `isSuperAdmin` here is already
   * current — a staff member demoted a minute ago is refused on their next call.
   * This check exists so the *service* is safe on its own terms: the day someone
   * calls it from a new controller and forgets the decorator, the rule that
   * matters most does not depend on their memory.
   *
   * The impersonation-chaining check is the part that is genuinely load-bearing
   * here — it is not expressible as a decorator.
   */
  private assertRealSuperAdmin(actor: AuthenticatedUser): void {
    if (actor.impersonatedBy) {
      throw new ForbiddenException('Não é possível iniciar uma visualização dentro de outra.');
    }
    if (!actor.isSuperAdmin) {
      throw new ForbiddenException('Super-admin access required');
    }
  }
}
