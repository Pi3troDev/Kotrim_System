import { BadRequestException, Injectable } from '@nestjs/common';
import { AuditAction, AuditResult, PasswordToken, PasswordTokenPurpose, User } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { sha256 } from '../../common/utils/hash.util';
import { hashPassword } from '../../common/utils/password.util';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { ClientInfo } from '../../common/decorators/client-info.decorator';

/** A setup link is a bootstrap step someone performs right away. */
const SETUP_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
/** Reset links are emailed; short-lived because they sit in an inbox. */
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export interface IssuedToken {
  /** The raw token — returned exactly once, never recoverable from the database. */
  token: string;
  expiresAt: Date;
}

/**
 * Issues and redeems single-use password tokens.
 *
 * Only the SHA-256 hash is persisted (same approach as RefreshToken), so a
 * database dump cannot be replayed into account takeover.
 */
@Injectable()
export class PasswordTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {}

  async issue(userId: string, purpose: PasswordTokenPurpose): Promise<IssuedToken> {
    const token = randomBytes(48).toString('base64url');
    const ttl = purpose === PasswordTokenPurpose.SETUP ? SETUP_TOKEN_TTL_MS : RESET_TOKEN_TTL_MS;
    const expiresAt = new Date(Date.now() + ttl);

    // Any older token of the same purpose is burned: issuing a new link must
    // invalidate the previous one, or a forwarded/leaked old link stays live.
    await this.prisma.passwordToken.updateMany({
      where: { userId, purpose, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.passwordToken.create({
      data: { userId, purpose, tokenHash: sha256(token), expiresAt },
    });

    return { token, expiresAt };
  }

  /**
   * Starts a password reset.
   *
   * Returns void regardless of whether the address exists. Telling a caller
   * "no account with that e-mail" turns this endpoint into a membership oracle
   * — anyone could enumerate which of their targets are Kotrim customers. The
   * UI says "if the address exists, the link is on its way" either way.
   */
  async requestReset(email: string, client?: ClientInfo): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (!user || !user.isActive || user.deletedAt) {
      // Audited even for an address with no account: the endpoint answers 202
      // either way, so this table is the only place a probe leaves a mark.
      this.auditService.record({
        action: AuditAction.PASSWORD_RESET_REQUESTED,
        result: AuditResult.FAILURE,
        entity: 'User',
        changes: { email, reason: user ? 'inactive_or_deleted' : 'unknown_email' },
        client,
      });
      return;
    }

    // An account with no password yet is mid-bootstrap and must be claimed with
    // its SETUP link, not reset into.
    if (!user.passwordInitializedAt) {
      return;
    }

    const { token } = await this.issue(user.id, PasswordTokenPurpose.RESET);

    this.auditService.record({
      action: AuditAction.PASSWORD_RESET_REQUESTED,
      entity: 'User',
      entityId: user.id,
      companyId: user.companyId,
      userId: user.id,
      client,
    });

    this.mailService.passwordReset(
      { email: user.email, name: user.name, userId: user.id, companyId: user.companyId },
      { name: user.name, token },
    );
  }

  /** Resolves a raw token to its row, or throws. Does not consume it. */
  async validate(token: string, purpose: PasswordTokenPurpose): Promise<PasswordToken & { user: User }> {
    const record = await this.prisma.passwordToken.findUnique({
      where: { tokenHash: sha256(token) },
      include: { user: true },
    });

    if (!record || record.purpose !== purpose || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Este link é inválido ou expirou.');
    }

    if (!record.user.isActive || record.user.deletedAt) {
      throw new BadRequestException('Este link é inválido ou expirou.');
    }

    return record;
  }

  /**
   * Sets the password and burns the token in one transaction — a crash between
   * the two must not leave a redeemable link on an account that already has a
   * password.
   */
  async redeem(
    token: string,
    purpose: PasswordTokenPurpose,
    newPassword: string,
    client?: ClientInfo,
  ): Promise<User> {
    const record = await this.validate(token, purpose);
    const passwordHash = await hashPassword(newPassword);

    const [, user] = await this.prisma.$transaction([
      this.prisma.passwordToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, passwordInitializedAt: record.user.passwordInitializedAt ?? new Date() },
      }),
      // Setting a password invalidates every existing session: for RESET this is
      // the point (lock out whoever prompted the reset), and for SETUP there are
      // no sessions to lose.
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    // Sent after the change, to the address as it stands: if this was an
    // account takeover, the real owner learns about it. Best-effort — the
    // password is already changed and a mail failure must not undo that.
    this.auditService.record({
      action: AuditAction.PASSWORD_CHANGED,
      entity: 'User',
      entityId: user.id,
      companyId: user.companyId,
      userId: user.id,
      changes: { via: purpose === PasswordTokenPurpose.SETUP ? 'setup_link' : 'reset_link' },
      client,
    });

    this.mailService.passwordChanged(
      { email: user.email, name: user.name, userId: user.id, companyId: user.companyId },
      { name: user.name },
    );

    return user;
  }
}
