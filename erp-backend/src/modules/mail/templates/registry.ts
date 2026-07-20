import { layout } from './components';
import { welcomeTrialTemplate } from './messages/welcome-trial.template';
import { trialEndingTemplate, trialExpiredTemplate } from './messages/trial.templates';
import {
  orderPendingTemplate,
  paymentConfirmedTemplate,
  subscriptionActivatedTemplate,
  subscriptionCancelledTemplate,
  subscriptionDowngradedTemplate,
  subscriptionRenewedTemplate,
  subscriptionUpgradedTemplate,
} from './messages/subscription.templates';
import { passwordChangedTemplate, passwordResetTemplate } from './messages/security.templates';
import {
  MailContext,
  MailTemplateData,
  MailTemplateKey,
  Renderer,
  TemplateRenderers,
} from './template.types';

/**
 * Every template, in one place.
 *
 * Typed so the compiler enforces two things that would otherwise be caught by a
 * customer: that each key has a renderer, and that each renderer accepts exactly
 * the payload declared for that key in `MailTemplateData`.
 */
const REGISTRY: { [K in MailTemplateKey]: TemplateRenderers<K> } = {
  [MailTemplateKey.WELCOME_TRIAL]: welcomeTrialTemplate,
  [MailTemplateKey.TRIAL_ENDING]: trialEndingTemplate,
  [MailTemplateKey.TRIAL_EXPIRED]: trialExpiredTemplate,
  [MailTemplateKey.ORDER_PENDING]: orderPendingTemplate,
  [MailTemplateKey.PAYMENT_CONFIRMED]: paymentConfirmedTemplate,
  [MailTemplateKey.SUBSCRIPTION_ACTIVATED]: subscriptionActivatedTemplate,
  [MailTemplateKey.SUBSCRIPTION_RENEWED]: subscriptionRenewedTemplate,
  [MailTemplateKey.SUBSCRIPTION_UPGRADED]: subscriptionUpgradedTemplate,
  [MailTemplateKey.SUBSCRIPTION_DOWNGRADED]: subscriptionDowngradedTemplate,
  [MailTemplateKey.SUBSCRIPTION_CANCELLED]: subscriptionCancelledTemplate,
  [MailTemplateKey.PASSWORD_RESET]: passwordResetTemplate,
  [MailTemplateKey.PASSWORD_CHANGED]: passwordChangedTemplate,
};

export interface RenderedMail {
  subject: string;
  html: string;
  text: string;
}

export interface RenderOptions {
  /** Prepends a banner naming the real recipient. Redirect mode only. */
  redirectNotice?: string;
}

/**
 * Renders a template into a sendable message.
 *
 * The only way to turn a template key into HTML — the layout (header, logo,
 * footer, contact, copyright) is applied here rather than by each template, so
 * a new message cannot accidentally ship without the brand around it.
 */
export function renderMail<K extends MailTemplateKey>(
  key: K,
  data: MailTemplateData[K],
  ctx: MailContext,
  options: RenderOptions = {},
): RenderedMail {
  const renderer = REGISTRY[key][ctx.locale] as Renderer<K>;
  const content = renderer(data, ctx);

  return {
    subject: content.subject,
    html: layout(content.body, {
      preheader: content.preheader,
      appUrl: ctx.appUrl,
      supportContact: ctx.supportContact,
      supportEmail: ctx.supportEmail,
      year: new Date().getFullYear(),
      redirectNotice: options.redirectNotice,
    }),
    text: content.text,
  };
}

/** Exposed for the template test-suite, which renders every entry. */
export const ALL_TEMPLATE_KEYS = Object.keys(REGISTRY) as MailTemplateKey[];
