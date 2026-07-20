import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MAIL_PROVIDER } from './mail-provider.interface';
import type { MailProvider } from './mail-provider.interface';
import { LOGO_BASE64, LOGO_CID, LOGO_FILENAME } from './templates/logo';
import { renderMail } from './templates/registry';
import {
  DEFAULT_LOCALE,
  MailContext,
  MailTemplateData,
  MailTemplateKey,
  REDACTED_PAYLOAD_FIELDS,
  STAFF_NOTIFIED_TEMPLATES,
} from './templates/template.types';

/** Who a message is for, and what to file the log row under. */
export interface MailRecipient {
  email: string;
  name: string;
  userId?: string | null;
  companyId?: string | null;
}

/**
 * The only thing the rest of the app talks to about e-mail.
 *
 * Callers name an event and hand over its data — they never see a transport, a
 * template, or HTML. That is what lets Resend be swapped, or an in-app
 * notification channel be added, without a single change in auth or billing.
 *
 * Every method is fire-and-forget. A slow or broken mail provider must never
 * fail a registration, a payment confirmation, or a password reset: the user's
 * action has already succeeded, and rolling it back over an e-mail would be
 * absurd. Failures land in MailLog instead of in the user's face.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @Inject(MAIL_PROVIDER) private readonly provider: MailProvider,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // ── The event API ─────────────────────────────────────────────────────────

  welcomeTrial(to: MailRecipient, data: MailTemplateData[MailTemplateKey.WELCOME_TRIAL]): void {
    this.emit(MailTemplateKey.WELCOME_TRIAL, to, data);
  }

  trialEnding(to: MailRecipient, data: MailTemplateData[MailTemplateKey.TRIAL_ENDING]): void {
    this.emit(MailTemplateKey.TRIAL_ENDING, to, data);
  }

  trialExpired(to: MailRecipient, data: MailTemplateData[MailTemplateKey.TRIAL_EXPIRED]): void {
    this.emit(MailTemplateKey.TRIAL_EXPIRED, to, data);
  }

  orderPending(to: MailRecipient, data: MailTemplateData[MailTemplateKey.ORDER_PENDING]): void {
    this.emit(MailTemplateKey.ORDER_PENDING, to, data);
  }

  paymentConfirmed(to: MailRecipient, data: MailTemplateData[MailTemplateKey.PAYMENT_CONFIRMED]): void {
    this.emit(MailTemplateKey.PAYMENT_CONFIRMED, to, data);
  }

  subscriptionActivated(
    to: MailRecipient,
    data: MailTemplateData[MailTemplateKey.SUBSCRIPTION_ACTIVATED],
  ): void {
    this.emit(MailTemplateKey.SUBSCRIPTION_ACTIVATED, to, data);
  }

  subscriptionRenewed(to: MailRecipient, data: MailTemplateData[MailTemplateKey.SUBSCRIPTION_RENEWED]): void {
    this.emit(MailTemplateKey.SUBSCRIPTION_RENEWED, to, data);
  }

  subscriptionUpgraded(to: MailRecipient, data: MailTemplateData[MailTemplateKey.SUBSCRIPTION_UPGRADED]): void {
    this.emit(MailTemplateKey.SUBSCRIPTION_UPGRADED, to, data);
  }

  subscriptionDowngraded(
    to: MailRecipient,
    data: MailTemplateData[MailTemplateKey.SUBSCRIPTION_DOWNGRADED],
  ): void {
    this.emit(MailTemplateKey.SUBSCRIPTION_DOWNGRADED, to, data);
  }

  subscriptionCancelled(
    to: MailRecipient,
    data: MailTemplateData[MailTemplateKey.SUBSCRIPTION_CANCELLED],
  ): void {
    this.emit(MailTemplateKey.SUBSCRIPTION_CANCELLED, to, data);
  }

  passwordReset(to: MailRecipient, data: MailTemplateData[MailTemplateKey.PASSWORD_RESET]): void {
    this.emit(MailTemplateKey.PASSWORD_RESET, to, data);
  }

  passwordChanged(to: MailRecipient, data: MailTemplateData[MailTemplateKey.PASSWORD_CHANGED]): void {
    this.emit(MailTemplateKey.PASSWORD_CHANGED, to, data);
  }

  /** Awaits delivery. For the admin "resend" action, which needs to report a result. */
  async resend<K extends MailTemplateKey>(
    key: K,
    to: MailRecipient,
    data: MailTemplateData[K],
  ): Promise<void> {
    await this.deliver(key, to, data, MailStatus.RESENT);
  }

  // ── The seam ──────────────────────────────────────────────────────────────

  /**
   * Every event in the system funnels through here.
   *
   * This is the extension point for in-app notifications: they would consume the
   * same `(key, recipient, data)` triple, so the catalogue of things Kotrim can
   * tell a customer stays in one place instead of drifting between channels.
   */
  private emit<K extends MailTemplateKey>(key: K, to: MailRecipient, data: MailTemplateData[K]): void {
    void this.deliver(key, to, data, MailStatus.SENT).catch((error: unknown) => {
      // deliver() already logged and recorded this; the catch only stops an
      // unhandled rejection from taking the process down.
      this.logger.debug(`emit(${key}) settled with an error: ${String(error)}`);
    });
  }

  private async deliver<K extends MailTemplateKey>(
    key: K,
    to: MailRecipient,
    data: MailTemplateData[K],
    successStatus: MailStatus,
  ): Promise<void> {
    const redirectTo = this.configService.get<string>('mail.redirectTo');
    const isRedirected = Boolean(redirectTo) && redirectTo !== to.email;
    const actualTo = isRedirected ? redirectTo! : to.email;

    const rendered = renderMail(key, data, this.context(), {
      redirectNotice: isRedirected
        ? `MODO DE TESTE — este e-mail seria enviado para ${to.email}`
        : undefined,
    });

    // Staff are blind-copied on the order e-mail so a pending payment can be
    // activated without the customer having to chase it. Skipped in redirect
    // mode, where the message is already going to that same inbox.
    const staffTo = this.configService.get<string>('mail.staffNotifyTo');
    const bcc =
      staffTo && !isRedirected && STAFF_NOTIFIED_TEMPLATES.has(key) && staffTo !== actualTo
        ? [staffTo]
        : undefined;

    try {
      const { providerMessageId } = await this.provider.send({
        to: actualTo,
        bcc,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        inlineImages: LOGO_BASE64
          ? [{ cid: LOGO_CID, filename: LOGO_FILENAME, content: LOGO_BASE64 }]
          : undefined,
      });

      await this.record({
        key,
        to: actualTo,
        subject: rendered.subject,
        recipient: to,
        status: successStatus,
        providerMessageId,
        payload: data,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send "${rendered.subject}" to ${actualTo}: ${message}`);

      await this.record({
        key,
        to: actualTo,
        subject: rendered.subject,
        recipient: to,
        status: MailStatus.FAILED,
        providerMessageId: null,
        error: message,
        payload: data,
      });

      throw error;
    }
  }

  /**
   * Writes the audit row. Swallows its own errors: if the database is unhappy,
   * that is not a reason to also lose the mail that was already sent.
   */
  private async record(entry: {
    key: MailTemplateKey;
    to: string;
    subject: string;
    recipient: MailRecipient;
    status: MailStatus;
    providerMessageId: string | null;
    error?: string;
    payload?: unknown;
  }): Promise<void> {
    try {
      await this.prisma.mailLog.create({
        data: {
          companyId: entry.recipient.companyId ?? null,
          userId: entry.recipient.userId ?? null,
          template: entry.key,
          to: entry.to,
          subject: entry.subject,
          status: entry.status,
          provider: this.provider.key,
          providerMessageId: entry.providerMessageId,
          payload: this.redactPayload(entry.key, entry.payload),
          // Postgres text has no practical limit, but a provider stack trace in
          // an audit row helps nobody.
          error: entry.error?.slice(0, 500),
        },
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to write MailLog: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Strips the fields that must not be persisted, and serialises through JSON so
   * Date values become strings the column can hold.
   */
  private redactPayload(key: MailTemplateKey, payload: unknown): Prisma.InputJsonValue | undefined {
    if (!payload || typeof payload !== 'object') return undefined;

    const redacted = { ...(payload as Record<string, unknown>) };
    for (const field of REDACTED_PAYLOAD_FIELDS[key] ?? []) {
      delete redacted[field];
    }

    return JSON.parse(JSON.stringify(redacted)) as Prisma.InputJsonValue;
  }

  private context(): MailContext {
    return {
      locale: DEFAULT_LOCALE,
      appUrl: this.configService.get<string>('appUrl') ?? 'http://localhost:4200',
      supportContact: this.configService.get<string>('billing.contact') || 'WhatsApp (11) 98998-5090',
      supportEmail: 'contato@kotrim.com.br',
      pixKey: this.configService.get<string>('billing.pixKey') || '',
    };
  }
}
