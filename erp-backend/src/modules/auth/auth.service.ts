import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import ms from 'ms';
import { randomBytes } from 'crypto';
import { AuditAction, AuditResult, SubscriptionStatus, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { addDays } from '../../common/utils/date.util';
import { UsersService } from '../users/users.service';
import { comparePassword, hashPassword } from '../../common/utils/password.util';
import { sha256 } from '../../common/utils/hash.util';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { LegalAcceptanceService } from '../legal/legal-acceptance.service';
import { ClientInfo } from '../../common/decorators/client-info.decorator';
import { RegisterCompanyDto, RegistrationIntent } from './dto/register-company.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthTokens, AuthResult } from './interfaces/auth-tokens.interface';
import { ALL_FEATURES } from '../billing/plan-features';

const DEFAULT_ADMIN_ROLE = 'Admin';

/** The subset of a User row that a session response is built from. */
type SessionUser = Pick<User, 'id' | 'name' | 'email' | 'companyId' | 'avatarUrl' | 'isSuperAdmin'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
    private readonly legalAcceptance: LegalAcceptanceService,
  ) {}

  async registerCompany(dto: RegisterCompanyDto, client?: ClientInfo): Promise<AuthResult> {
    const existing = await this.usersService.findByEmail(dto.adminEmail);
    if (existing) {
      throw new ConflictException('E-mail already in use');
    }

    const existingCompany = await this.prisma.company.findUnique({ where: { document: dto.companyDocument } });
    if (existingCompany) {
      throw new ConflictException('A company with this document is already registered');
    }

    const passwordHash = await hashPassword(dto.adminPassword);

    // Resolved before the transaction: an unknown slug should not roll back a
    // company that is otherwise fine. A bad slug simply means no plan is
    // pre-selected and the customer picks one on the subscription page.
    const chosenPlanId =
      dto.intent === RegistrationIntent.SUBSCRIBE && dto.planSlug
        ? (await this.prisma.plan.findFirst({ where: { slug: dto.planSlug, isActive: true } }))?.id
        : undefined;

    const { user, role, trialEndsAt, acceptedDocuments } = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: dto.companyName, document: dto.companyDocument },
      });

      const role = await tx.role.create({
        data: {
          companyId: company.id,
          name: DEFAULT_ADMIN_ROLE,
          description: 'Full access to all company resources',
          isSystem: true,
          // Every PlanFeature, unconditionally: the system Admin role is what
          // "full access" means, and it must never be narrowed by a cargo
          // preset the way an invited team member's role is.
          allowedFeatures: ALL_FEATURES as string[],
        },
      });

      const createdUser = await tx.user.create({
        data: {
          companyId: company.id,
          roleId: role.id,
          name: dto.adminName,
          email: dto.adminEmail,
          passwordHash,
          // Stamped here, not just on token redemption: `passwordInitializedAt
          // == null` is what marks an account as claimable via a SETUP link.
          // Leaving it null on a normal signup would make every customer
          // account eligible for a setup link.
          passwordInitializedAt: new Date(),
        },
      });

      // Created inside the same transaction as the company so a company can
      // never exist without a subscription row — SubscriptionGuard reads a
      // missing one as no access, which would lock out a brand-new signup.
      //
      // The two funnels diverge here, and only here:
      //   TRIAL     -> 7 free days, straight into the ERP
      //   SUBSCRIBE -> PENDING, no trial, no access until a payment is confirmed
      // Giving a "subscribe now" signup a trial anyway would hand out 7 free
      // days to someone who came to pay.
      const isSubscribeNow = dto.intent === RegistrationIntent.SUBSCRIBE;
      const trialEndsAt = addDays(new Date(), this.trialDurationDays());

      await tx.subscription.create({
        data: {
          companyId: company.id,
          status: isSubscribeNow ? SubscriptionStatus.PENDING : SubscriptionStatus.TRIAL,
          trialEndsAt: isSubscribeNow ? null : trialEndsAt,
          planId: isSubscribeNow ? (chosenPlanId ?? null) : null,
        },
      });

      // Same reasoning as the subscription row: a company must never exist
      // without a consent record for whatever Terms/Privacy are active right
      // now. `RegisterCompanyDto.acceptedTerms` already forced the checkbox at
      // the API boundary — this is what turns that checkbox into a row with a
      // version, a timestamp, and the IP it came from.
      const acceptedDocuments = await this.legalAcceptance.acceptCurrentAtRegistration(tx, createdUser.id, client);

      return {
        user: createdUser,
        role,
        trialEndsAt: isSubscribeNow ? null : trialEndsAt,
        acceptedDocuments,
      };
    });

    const tokens = await this.issueTokens({
      sub: user.id,
      companyId: user.companyId,
      roleId: user.roleId,
      email: user.email,
    });

    // Only the trial funnel gets the welcome mail. A "subscribe now" signup has
    // no trial to announce — telling them their 7 free days started would be a
    // lie, and they get the activation mail once payment lands instead.
    if (trialEndsAt) {
      this.mailService.welcomeTrial(
        { email: user.email, name: user.name, userId: user.id, companyId: user.companyId },
        {
          name: user.name,
          companyName: dto.companyName,
          trialEndsAt,
          trialDays: this.trialDurationDays(),
        },
      );
    }

    this.auditService.record({
      action: AuditAction.COMPANY_REGISTERED,
      entity: 'Company',
      entityId: user.companyId,
      companyId: user.companyId,
      userId: user.id,
      changes: { intent: dto.intent ?? RegistrationIntent.TRIAL, companyName: dto.companyName },
      client,
    });

    if (acceptedDocuments.length > 0) {
      this.auditService.record({
        action: AuditAction.LEGAL_TERMS_ACCEPTED,
        entity: 'LegalDocument',
        userId: user.id,
        companyId: user.companyId,
        changes: { types: acceptedDocuments.map((doc) => doc.type), versions: acceptedDocuments.map((doc) => doc.version) },
        client,
      });
    }

    return this.buildSession(user, role, tokens);
  }

  async login(dto: LoginDto, client?: ClientInfo): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.isActive) {
      // Recorded even though there is no user to attach it to: a burst of these
      // from one IP is exactly what someone probing for accounts looks like.
      this.auditService.record({
        action: AuditAction.LOGIN_FAILED,
        result: AuditResult.FAILURE,
        entity: 'User',
        changes: { email: dto.email, reason: user ? 'inactive' : 'unknown_email' },
        companyId: user?.companyId,
        userId: user?.id,
        client,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // An account with no password yet (super-admin bootstrap) can only be
    // entered by redeeming a SETUP token. Rejected here rather than handed to
    // bcrypt, which would be comparing against null. The message stays generic
    // on purpose: telling a caller "this account has no password" would both
    // confirm the address exists and advertise the account worth attacking.
    if (!user.passwordHash) {
      this.auditService.record({
        action: AuditAction.LOGIN_FAILED,
        result: AuditResult.FAILURE,
        entity: 'User',
        entityId: user.id,
        companyId: user.companyId,
        userId: user.id,
        changes: { reason: 'password_not_initialized' },
        client,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await comparePassword(dto.password, user.passwordHash);
    if (!passwordMatches) {
      this.auditService.record({
        action: AuditAction.LOGIN_FAILED,
        result: AuditResult.FAILURE,
        entity: 'User',
        entityId: user.id,
        companyId: user.companyId,
        userId: user.id,
        changes: { reason: 'wrong_password' },
        client,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.updateLastLogin(user.id);

    this.auditService.record({
      action: AuditAction.LOGIN,
      entity: 'User',
      entityId: user.id,
      companyId: user.companyId,
      userId: user.id,
      client,
    });

    const tokens = await this.issueTokens({
      sub: user.id,
      companyId: user.companyId,
      roleId: user.roleId,
      email: user.email,
    });

    return this.buildSession(user, user.role, tokens);
  }

  async refresh(rawRefreshToken: string, client?: ClientInfo): Promise<AuthResult> {
    const tokenHash = sha256(rawRefreshToken);

    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    // A token that was already rotated away being presented again means one of
    // two things happened: a stale retry (harmless), or someone else is holding
    // a copy of a token the legitimate user has since moved past (theft). There
    // is no way to tell those apart from here, so this is treated as theft —
    // every other active token for the user is killed, forcing a fresh login
    // everywhere rather than leaving a possibly-compromised session alive.
    if (stored.revokedAt) {
      const revoked = await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      this.auditService.record({
        action: AuditAction.REFRESH_TOKEN_REUSE_DETECTED,
        result: AuditResult.FAILURE,
        entity: 'User',
        entityId: stored.userId,
        userId: stored.userId,
        changes: { sessionsRevoked: revoked.count },
        client,
      });

      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const user = await this.usersService.findById(stored.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is no longer active');
    }

    const tokens = await this.issueTokens({
      sub: user.id,
      companyId: user.companyId,
      roleId: user.roleId,
      email: user.email,
    });

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedBy: tokens.refreshTokenId },
    });

    return this.buildSession(user, user.role, tokens);
  }

  async logout(rawRefreshToken: string, client?: ClientInfo): Promise<void> {
    const tokenHash = sha256(rawRefreshToken);

    // Resolved before revoking, so the row knows who logged out.
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, companyId: true } } },
    });

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (stored) {
      this.auditService.record({
        action: AuditAction.LOGOUT,
        entity: 'User',
        entityId: stored.user.id,
        companyId: stored.user.companyId,
        userId: stored.user.id,
        client,
      });
    }
  }

  private trialDurationDays(): number {
    return this.configService.get<number>('billing.trialDurationDays') ?? 7;
  }

  private async issueTokens(payload: JwtPayload): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync(payload as object, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn') as ms.StringValue,
    });

    const refreshToken = randomBytes(64).toString('hex');
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn')!;

    const refreshTokenRow = await this.prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + ms(refreshExpiresIn as ms.StringValue)),
      },
    });

    return { accessToken, refreshToken, refreshTokenId: refreshTokenRow.id };
  }

  /** Takes the user row rather than a positional list — the field count grew past the point where order was safe to trust. */
  private buildSession(
    user: SessionUser,
    role: { name: string; allowedFeatures: string[] },
    tokens: AuthTokens,
  ): AuthResult {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        companyId: user.companyId,
        role: role.name,
        roleAllowedFeatures: role.allowedFeatures,
        avatarUrl: user.avatarUrl,
        isSuperAdmin: user.isSuperAdmin,
      },
    };
  }
}
