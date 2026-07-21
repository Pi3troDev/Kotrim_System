import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, PasswordTokenPurpose } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { PasswordTokenService } from '../auth/password-token.service';
import { ClientInfo } from '../../common/decorators/client-info.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { featuresForSubscription, maxUsersForSubscription } from '../billing/plan-features';
import { CARGO_FEATURES, CARGO_LABELS, Cargo, listCargoOptions, roleNameForCargo } from './cargo';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

export interface TeamMemberSummary {
  id: string;
  name: string;
  email: string;
  cargo: string | null;
  isSystemAdmin: boolean;
  isActive: boolean;
  /** False while the invite is still waiting on the setup link being redeemed. */
  hasJoined: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class TeamMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
    private readonly passwordTokenService: PasswordTokenService,
  ) {}

  async list(companyId: string): Promise<TeamMemberSummary[]> {
    const users = await this.prisma.user.findMany({
      where: { companyId, deletedAt: null },
      include: { role: { select: { name: true, isSystem: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      cargo: user.role.isSystem ? null : this.cargoLabelFromRoleName(user.role.name),
      isSystemAdmin: user.role.isSystem,
      isActive: user.isActive,
      hasJoined: user.passwordInitializedAt !== null,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    }));
  }

  async listCargos(companyId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });
    return listCargoOptions(featuresForSubscription(subscription));
  }

  async invite(
    companyId: string,
    dto: InviteTeamMemberDto,
    actingUser: AuthenticatedUser,
    client?: ClientInfo,
  ): Promise<TeamMemberSummary> {
    // Email is globally unique even across soft-deleted rows, so a user removed
    // by mistake (or genuinely re-hired) would otherwise be stuck forever behind
    // this same address. Only a *live* account blocks a new invite.
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
    if (existing && existing.deletedAt === null) {
      throw new ConflictException('Já existe uma conta com este e-mail.');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });

    const planFeatures = featuresForSubscription(subscription);
    const missingFeature = CARGO_FEATURES[dto.cargo].find((f) => !planFeatures.includes(f));
    if (missingFeature) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'CARGO_REQUIRES_PLAN_UPGRADE',
        feature: missingFeature,
        message: `O cargo ${CARGO_LABELS[dto.cargo]} precisa de um módulo que seu plano não inclui. Faça upgrade para liberar.`,
      });
    }

    await this.assertUserQuota(companyId, subscription);

    const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId }, select: { name: true } });

    const roleName = roleNameForCargo(dto.cargo);
    const user = await this.prisma.$transaction(async (tx) => {
      const role = await tx.role.upsert({
        where: { companyId_name: { companyId, name: roleName } },
        update: {},
        create: {
          companyId,
          name: roleName,
          description: CARGO_LABELS[dto.cargo],
          allowedFeatures: [...CARGO_FEATURES[dto.cargo]],
        },
      });

      if (existing) {
        // Revives the same row instead of forking a new one under a fresh id —
        // that keeps whatever audit trail and past work orders it already has
        // attributed to the same person, and sidesteps the email unique
        // constraint, which the deleted row still holds.
        return tx.user.update({
          where: { id: existing.id },
          data: {
            companyId,
            roleId: role.id,
            name: dto.name,
            deletedAt: null,
            isActive: true,
            // Re-claimed via a fresh SETUP link, same as a brand-new invite —
            // the old password must not silently keep working.
            passwordHash: null,
            passwordInitializedAt: null,
          },
        });
      }

      return tx.user.create({
        data: {
          companyId,
          roleId: role.id,
          name: dto.name,
          email: dto.email.toLowerCase().trim(),
          // No password yet — claimable only via the SETUP link this issues next.
          passwordHash: null,
          passwordInitializedAt: null,
        },
      });
    });

    const { token } = await this.passwordTokenService.issue(user.id, PasswordTokenPurpose.SETUP);

    this.mailService.teamInvite(
      { email: user.email, name: user.name, userId: user.id, companyId },
      { name: user.name, companyName: company.name, cargoName: CARGO_LABELS[dto.cargo], token },
    );

    this.auditService.record({
      action: AuditAction.CREATE,
      entity: 'User',
      entityId: user.id,
      companyId,
      userId: actingUser.id,
      changes: { invited: user.email, cargo: dto.cargo, revived: Boolean(existing) },
      client,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      cargo: CARGO_LABELS[dto.cargo],
      isSystemAdmin: false,
      isActive: user.isActive,
      hasJoined: false,
      lastLoginAt: null,
      createdAt: user.createdAt,
    };
  }

  async update(
    companyId: string,
    userId: string,
    dto: UpdateTeamMemberDto,
    actingUser: AuthenticatedUser,
    client?: ClientInfo,
  ): Promise<TeamMemberSummary> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId, deletedAt: null },
      include: { role: { select: { name: true, isSystem: true } } },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (userId === actingUser.id) {
      throw new ForbiddenException('Você não pode alterar o próprio acesso por aqui.');
    }

    if (dto.isActive === false && user.role.isSystem) {
      const otherActiveAdmins = await this.prisma.user.count({
        where: { companyId, deletedAt: null, isActive: true, role: { isSystem: true }, id: { not: userId } },
      });
      if (otherActiveAdmins === 0) {
        throw new ForbiddenException('A empresa precisa de pelo menos um administrador ativo.');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      include: { role: { select: { name: true, isSystem: true } } },
    });

    this.auditService.record({
      action: AuditAction.UPDATE,
      entity: 'User',
      entityId: updated.id,
      companyId,
      userId: actingUser.id,
      changes: { isActive: dto.isActive },
      client,
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      cargo: updated.role.isSystem ? null : this.cargoLabelFromRoleName(updated.role.name),
      isSystemAdmin: updated.role.isSystem,
      isActive: updated.isActive,
      hasJoined: updated.passwordInitializedAt !== null,
      lastLoginAt: updated.lastLoginAt,
      createdAt: updated.createdAt,
    };
  }

  /**
   * Soft-deletes the login. Kept as `deletedAt` (not a hard delete) because a
   * User is the `userId` on their own audit trail, work orders, mail logs —
   * removing the row outright would either orphan or cascade-delete history
   * that has nothing to do with the access decision being made here.
   */
  async remove(companyId: string, userId: string, actingUser: AuthenticatedUser, client?: ClientInfo): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId, deletedAt: null },
      include: { role: { select: { isSystem: true } } },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (userId === actingUser.id) {
      throw new ForbiddenException('Você não pode excluir o próprio acesso por aqui.');
    }

    if (user.role.isSystem) {
      const otherActiveAdmins = await this.prisma.user.count({
        where: { companyId, deletedAt: null, isActive: true, role: { isSystem: true }, id: { not: userId } },
      });
      if (otherActiveAdmins === 0) {
        throw new ForbiddenException('A empresa precisa de pelo menos um administrador ativo.');
      }
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date(), isActive: false },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.passwordToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    this.auditService.record({
      action: AuditAction.DELETE,
      entity: 'User',
      entityId: userId,
      companyId,
      userId: actingUser.id,
      changes: { deletedEmail: user.email },
      client,
    });
  }

  /**
   * Re-sends the setup link. Needed whenever the first e-mail never arrived —
   * a Resend outage, a typo since fixed by IT, or (as happened once) a bad API
   * key — since the invited address is already taken by the pending user and
   * a second `invite()` call would just hit the uniqueness check.
   */
  async resendInvite(
    companyId: string,
    userId: string,
    actingUser: AuthenticatedUser,
    client?: ClientInfo,
  ): Promise<TeamMemberSummary> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId, deletedAt: null },
      include: { role: { select: { name: true, isSystem: true } } },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    if (user.passwordInitializedAt !== null) {
      throw new BadRequestException('Este usuário já concluiu o cadastro.');
    }
    if (!user.isActive) {
      throw new BadRequestException('Reative o usuário antes de reenviar o convite.');
    }

    const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId }, select: { name: true } });
    const { token } = await this.passwordTokenService.issue(user.id, PasswordTokenPurpose.SETUP);

    this.mailService.teamInvite(
      { email: user.email, name: user.name, userId: user.id, companyId },
      { name: user.name, companyName: company.name, cargoName: this.cargoLabelFromRoleName(user.role.name), token },
    );

    this.auditService.record({
      action: AuditAction.UPDATE,
      entity: 'User',
      entityId: user.id,
      companyId,
      userId: actingUser.id,
      changes: { resentInviteTo: user.email },
      client,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      cargo: user.role.isSystem ? null : this.cargoLabelFromRoleName(user.role.name),
      isSystemAdmin: user.role.isSystem,
      isActive: user.isActive,
      hasJoined: false,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  /**
   * Seats already claimed never block a deactivate-then-reinvite: only active
   * logins count, so freeing one immediately makes room for the next hire.
   */
  private async assertUserQuota(
    companyId: string,
    subscription: Parameters<typeof maxUsersForSubscription>[0],
  ): Promise<void> {
    const limit = maxUsersForSubscription(subscription);
    if (limit === null) {
      return;
    }

    const current = await this.prisma.user.count({ where: { companyId, deletedAt: null, isActive: true } });
    if (current < limit) {
      return;
    }

    throw new ForbiddenException({
      statusCode: 403,
      error: 'PLAN_LIMIT_REACHED',
      limit,
      message: `Seu plano permite até ${limit} usuários e você já tem ${current}. Faça upgrade para convidar mais gente.`,
    });
  }

  private cargoLabelFromRoleName(roleName: string): string {
    const cargoKey = roleName.replace(/^cargo:/, '') as Cargo;
    return CARGO_LABELS[cargoKey] ?? roleName;
  }
}
