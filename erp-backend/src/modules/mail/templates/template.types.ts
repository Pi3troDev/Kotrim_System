/**
 * The catalogue of everything Kotrim can say by e-mail.
 *
 * This file is the contract: a template key, the data it needs, and the locales
 * it speaks. Adding a message is adding an entry here and a file under
 * `templates/messages/` — nothing else in the app changes.
 */

/**
 * Also the event name. In-app notifications, when they arrive, hang off these
 * same keys and payloads rather than inventing a parallel vocabulary — that is
 * the "same base of events" the notification centre is built on.
 */
export enum MailTemplateKey {
  // Signup
  WELCOME_TRIAL = 'WELCOME_TRIAL',
  // Trial lifecycle
  TRIAL_ENDING = 'TRIAL_ENDING',
  TRIAL_EXPIRED = 'TRIAL_EXPIRED',
  // Subscription lifecycle
  ORDER_PENDING = 'ORDER_PENDING',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  SUBSCRIPTION_ACTIVATED = 'SUBSCRIPTION_ACTIVATED',
  SUBSCRIPTION_RENEWED = 'SUBSCRIPTION_RENEWED',
  SUBSCRIPTION_UPGRADED = 'SUBSCRIPTION_UPGRADED',
  SUBSCRIPTION_DOWNGRADED = 'SUBSCRIPTION_DOWNGRADED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  // Security
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  // Team
  TEAM_INVITE = 'TEAM_INVITE',
}

/**
 * Locales the system can send in.
 *
 * Typed as a union rather than a string so `TemplateRenderers` below is a
 * `Record<MailLocale, ...>`: the day 'en-US' is added, TypeScript lists every
 * template still missing a translation instead of shipping a silent pt-BR
 * fallback to an English customer.
 */
export type MailLocale = 'pt-BR';

export const DEFAULT_LOCALE: MailLocale = 'pt-BR';

/** Brand-level values every template can reach, independent of the event. */
export interface MailContext {
  locale: MailLocale;
  appUrl: string;
  supportContact: string;
  supportEmail: string;
  pixKey: string;
}

/** What a renderer produces. The layout wraps `body`; `text` is the plain-text part. */
export interface RenderedContent {
  subject: string;
  preheader: string;
  body: string;
  text: string;
}

// ── Per-template payloads ───────────────────────────────────────────────────

export interface WelcomeTrialData {
  name: string;
  companyName: string;
  trialEndsAt: Date;
  trialDays: number;
}

export interface TrialEndingData {
  name: string;
  companyName: string;
  daysLeft: number;
  trialEndsAt: Date;
}

export interface TrialExpiredData {
  name: string;
  companyName: string;
}

export interface OrderPendingData {
  name: string;
  planName: string;
  amountCents: number;
}

export interface PaymentConfirmedData {
  name: string;
  planName: string;
  amountCents: number;
  method: string;
}

export interface SubscriptionActivatedData {
  name: string;
  planName: string;
  periodEnd: Date;
}

export interface SubscriptionRenewedData {
  name: string;
  planName: string;
  periodEnd: Date;
}

export interface PlanChangeData {
  name: string;
  previousPlanName: string;
  planName: string;
  periodEnd: Date;
}

export interface SubscriptionCancelledData {
  name: string;
  planName: string | null;
}

export interface PasswordResetData {
  name: string;
  token: string;
}

export interface PasswordChangedData {
  name: string;
}

export interface TeamInviteData {
  name: string;
  companyName: string;
  cargoName: string;
  token: string;
}

/** The single source of truth mapping each key to its payload. */
export interface MailTemplateData {
  [MailTemplateKey.WELCOME_TRIAL]: WelcomeTrialData;
  [MailTemplateKey.TRIAL_ENDING]: TrialEndingData;
  [MailTemplateKey.TRIAL_EXPIRED]: TrialExpiredData;
  [MailTemplateKey.ORDER_PENDING]: OrderPendingData;
  [MailTemplateKey.PAYMENT_CONFIRMED]: PaymentConfirmedData;
  [MailTemplateKey.SUBSCRIPTION_ACTIVATED]: SubscriptionActivatedData;
  [MailTemplateKey.SUBSCRIPTION_RENEWED]: SubscriptionRenewedData;
  [MailTemplateKey.SUBSCRIPTION_UPGRADED]: PlanChangeData;
  [MailTemplateKey.SUBSCRIPTION_DOWNGRADED]: PlanChangeData;
  [MailTemplateKey.SUBSCRIPTION_CANCELLED]: SubscriptionCancelledData;
  [MailTemplateKey.PASSWORD_RESET]: PasswordResetData;
  [MailTemplateKey.PASSWORD_CHANGED]: PasswordChangedData;
  [MailTemplateKey.TEAM_INVITE]: TeamInviteData;
}

export type Renderer<K extends MailTemplateKey> = (
  data: MailTemplateData[K],
  ctx: MailContext,
) => RenderedContent;

/** Every template must render in every supported locale — enforced at compile time. */
export type TemplateRenderers<K extends MailTemplateKey> = Record<MailLocale, Renderer<K>>;

/**
 * Templates that also go to Kotrim staff, blind-copied.
 *
 * Only the order e-mail: it is the one moment where a human on our side has to
 * act — a customer is about to Pix and cannot get in until someone confirms it.
 * Copying staff on anything else (password resets above all) would be both
 * noise and a privacy problem.
 */
export const STAFF_NOTIFIED_TEMPLATES: ReadonlySet<MailTemplateKey> = new Set([
  MailTemplateKey.ORDER_PENDING,
]);

/**
 * Payload fields that must never reach the database.
 *
 * MailLog stores the payload so a message can be previewed and resent. A
 * password-reset token in there would mean any read of that table — a support
 * query, a backup, a leaked dump — hands over a working account takeover, for
 * the price of one SELECT.
 *
 * A template listed here can be previewed (with the field blanked) but not
 * resent: the value that made it work is gone, which is the point.
 */
export const REDACTED_PAYLOAD_FIELDS: Partial<Record<MailTemplateKey, readonly string[]>> = {
  [MailTemplateKey.PASSWORD_RESET]: ['token'],
  [MailTemplateKey.TEAM_INVITE]: ['token'],
};

/** True when this template's stored payload is missing something it needs to render for real. */
export function isPayloadRedacted(key: MailTemplateKey): boolean {
  return (REDACTED_PAYLOAD_FIELDS[key]?.length ?? 0) > 0;
}

/** Human labels for the admin mail-history screen. */
export const MAIL_TEMPLATE_LABELS: Record<MailTemplateKey, string> = {
  [MailTemplateKey.WELCOME_TRIAL]: 'Boas-vindas / início do teste',
  [MailTemplateKey.TRIAL_ENDING]: 'Teste terminando',
  [MailTemplateKey.TRIAL_EXPIRED]: 'Teste expirado',
  [MailTemplateKey.ORDER_PENDING]: 'Pedido de assinatura criado',
  [MailTemplateKey.PAYMENT_CONFIRMED]: 'Pagamento confirmado',
  [MailTemplateKey.SUBSCRIPTION_ACTIVATED]: 'Assinatura ativada',
  [MailTemplateKey.SUBSCRIPTION_RENEWED]: 'Assinatura renovada',
  [MailTemplateKey.SUBSCRIPTION_UPGRADED]: 'Upgrade de plano',
  [MailTemplateKey.SUBSCRIPTION_DOWNGRADED]: 'Downgrade de plano',
  [MailTemplateKey.SUBSCRIPTION_CANCELLED]: 'Assinatura cancelada',
  [MailTemplateKey.PASSWORD_RESET]: 'Recuperação de senha',
  [MailTemplateKey.PASSWORD_CHANGED]: 'Senha alterada',
  [MailTemplateKey.TEAM_INVITE]: 'Convite de equipe',
};
