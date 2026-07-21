import { ALL_TEMPLATE_KEYS, renderMail } from './registry';
import { MailContext, MailTemplateData, MailTemplateKey, MAIL_TEMPLATE_LABELS } from './template.types';

/**
 * Renders every template and inspects the output.
 *
 * E-mail has no runtime to catch mistakes: a broken template is discovered by a
 * customer, in their inbox, with no way to take it back. These tests are the
 * only safety net that exists before the send button.
 */

const ctx: MailContext = {
  locale: 'pt-BR',
  appUrl: 'https://kotrim.com.br',
  supportContact: 'WhatsApp (11) 98998-5090',
  supportEmail: 'contato@kotrim.com.br',
  pixKey: '11989985090',
};

const PERIOD_END = new Date('2026-08-16T12:00:00Z');
const TRIAL_END = new Date('2026-07-24T12:00:00Z');

/** A realistic payload for every key — the fixture the whole suite renders from. */
const FIXTURES: { [K in MailTemplateKey]: MailTemplateData[K] } = {
  [MailTemplateKey.WELCOME_TRIAL]: {
    name: 'João Pereira',
    companyName: 'Oficina São João',
    trialEndsAt: TRIAL_END,
    trialDays: 7,
  },
  [MailTemplateKey.TRIAL_ENDING]: {
    name: 'João Pereira',
    companyName: 'Oficina São João',
    daysLeft: 2,
    trialEndsAt: TRIAL_END,
  },
  [MailTemplateKey.TRIAL_EXPIRED]: { name: 'João Pereira', companyName: 'Oficina São João' },
  [MailTemplateKey.ORDER_PENDING]: { name: 'João Pereira', planName: 'Profissional', amountCents: 19900 },
  [MailTemplateKey.PAYMENT_CONFIRMED]: {
    name: 'João Pereira',
    planName: 'Profissional',
    amountCents: 19900,
    method: 'Pix',
  },
  [MailTemplateKey.SUBSCRIPTION_ACTIVATED]: {
    name: 'João Pereira',
    planName: 'Profissional',
    periodEnd: PERIOD_END,
  },
  [MailTemplateKey.SUBSCRIPTION_RENEWED]: {
    name: 'João Pereira',
    planName: 'Profissional',
    periodEnd: PERIOD_END,
  },
  [MailTemplateKey.SUBSCRIPTION_UPGRADED]: {
    name: 'João Pereira',
    previousPlanName: 'Essencial',
    planName: 'Profissional',
    periodEnd: PERIOD_END,
  },
  [MailTemplateKey.SUBSCRIPTION_DOWNGRADED]: {
    name: 'João Pereira',
    previousPlanName: 'Oficina Plus',
    planName: 'Essencial',
    periodEnd: PERIOD_END,
  },
  [MailTemplateKey.SUBSCRIPTION_CANCELLED]: { name: 'João Pereira', planName: 'Profissional' },
  [MailTemplateKey.PASSWORD_RESET]: { name: 'João Pereira', token: 'tok_abc123' },
  [MailTemplateKey.PASSWORD_CHANGED]: { name: 'João Pereira' },
  [MailTemplateKey.TEAM_INVITE]: {
    name: 'Carlos Mendes',
    companyName: 'Oficina São João',
    cargoName: 'Mecânico',
    token: 'tok_abc123',
  },
};

function renderAll() {
  return ALL_TEMPLATE_KEYS.map((key) => ({
    key,
    ...renderMail(key, FIXTURES[key] as never, ctx),
  }));
}

describe('mail templates', () => {
  it('has a fixture for every registered template', () => {
    expect(Object.keys(FIXTURES).sort()).toEqual([...ALL_TEMPLATE_KEYS].sort());
  });

  it('has a human label for every registered template — the admin screen reads these', () => {
    for (const key of ALL_TEMPLATE_KEYS) {
      expect(MAIL_TEMPLATE_LABELS[key]).toBeTruthy();
    }
  });

  describe.each(ALL_TEMPLATE_KEYS)('%s', (key) => {
    const mail = () => renderMail(key, FIXTURES[key] as never, ctx);

    it('renders a subject, html and text', () => {
      const { subject, html, text } = mail();
      expect(subject.length).toBeGreaterThan(0);
      expect(html.length).toBeGreaterThan(0);
      expect(text.length).toBeGreaterThan(0);
    });

    it('carries the brand shell: logo, header and footer', () => {
      const { html } = mail();
      // cid, not a URL: the logo travels inside the message so it renders
      // whether or not kotrim.com.br is deployed.
      expect(html).toContain('src="cid:kotrim-logo"');
      expect(html).toContain('Kotrim');
      expect(html).toContain('© 2026 Kotrim');
      expect(html).toContain('sistema de gestão para oficinas');
    });

    it('never points the logo at a URL that may not resolve', () => {
      expect(mail().html).not.toContain('/brand/kotrim-mark');
    });

    it('is a complete, responsive document', () => {
      const { html } = mail();
      expect(html).toContain('<!doctype html>');
      expect(html).toContain('name="viewport"');
      expect(html).toContain('lang="pt-BR"');
    });

    it('leaves no unreplaced template variable', () => {
      // The failure this catches is the embarrassing one: "Olá, ${name}" in a
      // customer's inbox.
      const { subject, html, text } = mail();
      for (const part of [subject, html, text]) {
        expect(part).not.toMatch(/\$\{/);
        expect(part).not.toMatch(/undefined|NaN|\[object Object\]/);
      }
    });

    it('has no unresolved link', () => {
      const { html } = mail();
      expect(html).not.toContain('href=""');
      expect(html).not.toContain('href="undefined');
      // Relative hrefs do not resolve in an inbox — every link must be absolute.
      expect(html).not.toMatch(/href="\/(?!\/)/);
    });

    it('addresses the person by first name only', () => {
      const { html, text } = mail();
      expect(html + text).not.toContain('João Pereira');
    });
  });

  describe('specifics that would be embarrassing to get wrong', () => {
    it('welcome states the exact trial end date', () => {
      const { html, text } = renderMail(MailTemplateKey.WELCOME_TRIAL, FIXTURES[MailTemplateKey.WELCOME_TRIAL], ctx);
      expect(html).toContain('24 de julho de 2026');
      expect(text).toContain('24 de julho de 2026');
    });

    it('order-pending carries the real Pix key and the amount', () => {
      const { html, text } = renderMail(MailTemplateKey.ORDER_PENDING, FIXTURES[MailTemplateKey.ORDER_PENDING], ctx);
      expect(html).toContain('11989985090');
      expect(text).toContain('11989985090');
      // Non-breaking space in pt-BR currency output — match loosely.
      expect(html.replace(/ /g, ' ')).toContain('R$ 199,00');
    });

    it('order-pending says plainly that access is not open yet', () => {
      const { html } = renderMail(MailTemplateKey.ORDER_PENDING, FIXTURES[MailTemplateKey.ORDER_PENDING], ctx);
      expect(html).toContain('ainda não está liberado');
    });

    it('password reset embeds the token in an absolute link', () => {
      const { html, text } = renderMail(MailTemplateKey.PASSWORD_RESET, FIXTURES[MailTemplateKey.PASSWORD_RESET], ctx);
      const url = 'https://kotrim.com.br/auth/reset-password?token=tok_abc123';
      expect(html).toContain(url);
      expect(text).toContain(url);
    });

    it('password reset never invites the user to click when it was not them', () => {
      // A "wasn't you? click here" link is a phishing pattern; doing nothing is
      // the safe action and the copy must say so.
      const { text } = renderMail(MailTemplateKey.PASSWORD_RESET, FIXTURES[MailTemplateKey.PASSWORD_RESET], ctx);
      expect(text).toContain('ignore este e-mail');
    });

    it('downgrade leads with the reassurance that nothing was deleted', () => {
      const { html } = renderMail(
        MailTemplateKey.SUBSCRIPTION_DOWNGRADED,
        FIXTURES[MailTemplateKey.SUBSCRIPTION_DOWNGRADED],
        ctx,
      );
      expect(html).toContain('Nada foi apagado');
    });

    it('cancellation survives a subscription that never had a plan', () => {
      const { html } = renderMail(
        MailTemplateKey.SUBSCRIPTION_CANCELLED,
        { name: 'João Pereira', planName: null },
        ctx,
      );
      expect(html).toContain('Assinatura cancelada');
      expect(html).not.toContain('null');
    });
  });

  describe('escaping', () => {
    it('escapes a workshop name that contains markup', () => {
      const { html } = renderMail(
        MailTemplateKey.WELCOME_TRIAL,
        { ...FIXTURES[MailTemplateKey.WELCOME_TRIAL], companyName: '<script>alert(1)</script>' },
        ctx,
      );
      // Company names come from a signup form and land in someone's inbox.
      expect(html).not.toContain('<script>alert(1)</script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('redirect mode', () => {
    it('stamps the intended recipient into the body', () => {
      const { html } = renderMail(MailTemplateKey.WELCOME_TRIAL, FIXTURES[MailTemplateKey.WELCOME_TRIAL], ctx, {
        redirectNotice: 'MODO DE TESTE — este e-mail seria enviado para cliente@oficina.com',
      });
      expect(html).toContain('cliente@oficina.com');
      expect(html).toContain('MODO DE TESTE');
    });

    it('adds nothing when off', () => {
      const { html } = renderMail(MailTemplateKey.WELCOME_TRIAL, FIXTURES[MailTemplateKey.WELCOME_TRIAL], ctx);
      expect(html).not.toContain('MODO DE TESTE');
    });
  });

  describe('every template, end to end', () => {
    it('renders all of them without throwing', () => {
      expect(() => renderAll()).not.toThrow();
      expect(renderAll()).toHaveLength(ALL_TEMPLATE_KEYS.length);
    });

    it('gives each one a distinct subject', () => {
      const subjects = renderAll().map((m) => m.subject);
      expect(new Set(subjects).size).toBe(subjects.length);
    });

    it('gives each one a preheader, so the inbox preview is never scraped copy', () => {
      for (const key of ALL_TEMPLATE_KEYS) {
        const { html } = renderMail(key, FIXTURES[key] as never, ctx);
        const preheader = html.match(/mso-hide:all;">([^<]*)</)?.[1] ?? '';
        expect(preheader.trim().length).toBeGreaterThan(10);
      }
    });
  });
});
