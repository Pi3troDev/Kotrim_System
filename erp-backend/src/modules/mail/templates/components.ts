import { theme } from './theme';
import { LOGO_BASE64, LOGO_CID } from './logo';

/**
 * The building blocks every Kotrim e-mail is assembled from.
 *
 * Tables and inline styles throughout, deliberately. This is not 2010
 * nostalgia: Outlook renders through Word's HTML engine, which ignores flex,
 * grid, and most positioning, and Gmail strips `<style>` blocks. A div-and-class
 * layout looks perfect in a browser preview and falls apart in the two clients
 * most Brazilian workshop owners actually use.
 *
 * Every block returns an HTML string plus, where it matters, a text equivalent —
 * the plain-text part is always sent, both for clients that refuse HTML and
 * because a missing text part hurts deliverability.
 */

const { color, font, size } = theme;

/** Escapes user-supplied values. Workshop names come from a form; a stray `<` must not break the layout — or inject markup into an inbox. */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface LayoutOptions {
  /** Shown in the inbox list under the subject. Without it, clients scrape the first text they find — usually "Kotrim". */
  preheader: string;
  appUrl: string;
  supportContact: string;
  supportEmail: string;
  year: number;
  /** Only in redirect mode: a banner naming the real recipient. */
  redirectNotice?: string;
}

export function layout(bodyHtml: string, options: LayoutOptions): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>Kotrim</title>
</head>
<body style="margin:0;padding:0;background:${color.mist};font-family:${font.body};-webkit-font-smoothing:antialiased;">
  <!-- Preheader: shown in the inbox preview, never on the page. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(options.preheader)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${color.mist};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        ${options.redirectNotice ? redirectBanner(options.redirectNotice) : ''}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:${size.container}px;background:${color.paper};border-radius:${size.radius}px;border:1px solid ${color.line};overflow:hidden;">
          ${header()}
          <tr>
            <td style="padding:36px 40px 32px;">
              ${bodyHtml}
            </td>
          </tr>
          ${footer(options)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * The mark travels inside the message as `cid:` rather than as a URL.
 *
 * A `src="https://kotrim.com.br/..."` only resolves once that site is deployed,
 * and a data: URI is stripped by Gmail — both would show a broken icon in the
 * customer's inbox. An inline attachment depends on nothing.
 *
 * The mark sits on a white chip because the artwork is near-black line work and
 * the header is navy: without it, the logo disappears. The wordmark beside it is
 * live text, so the brand still reads when images are blocked — which they are,
 * by default, in plenty of clients.
 */
function header(): string {
  const mark = LOGO_BASE64
    ? `<td style="padding-right:10px;vertical-align:middle;">
            <img src="cid:${LOGO_CID}" width="30" height="30" alt=""
                 style="display:block;border:0;background:${color.paper};border-radius:7px;" />
          </td>`
    : '';

  return `<tr>
    <td style="background:${color.navy900};padding:22px 40px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${mark}
          <td style="vertical-align:middle;">
            <span style="color:${color.paper};font-size:19px;font-weight:700;letter-spacing:-0.02em;">Kotrim</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function footer(options: LayoutOptions): string {
  return `<tr>
    <td style="padding:24px 40px 28px;background:${color.mist};border-top:1px solid ${color.line};">
      <p style="margin:0 0 10px;font-size:13px;line-height:1.5;color:${color.muted};">
        Precisa de ajuda? Fale com a gente pelo
        <a href="https://wa.me/5511989985090" style="color:${color.blue600};text-decoration:none;font-weight:600;">WhatsApp</a>
        ou por
        <a href="mailto:${esc(options.supportEmail)}" style="color:${color.blue600};text-decoration:none;font-weight:600;">e-mail</a>.
      </p>
      <p style="margin:0 0 14px;font-size:13px;line-height:1.5;color:${color.muted};">
        ${esc(options.supportContact)}
      </p>
      <p style="margin:0;font-size:12px;line-height:1.5;color:${color.faint};">
        © ${options.year} Kotrim — sistema de gestão para oficinas mecânicas.<br />
        Você recebeu este e-mail porque tem uma conta no Kotrim.
      </p>
    </td>
  </tr>`;
}

function redirectBanner(notice: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${size.container}px;margin-bottom:12px;">
    <tr><td style="background:${color.warnSoft};border:1px dashed ${color.warn};border-radius:${size.radiusSm}px;padding:12px 16px;">
      <p style="margin:0;font-size:13px;line-height:1.5;color:${color.warn};font-weight:600;">${esc(notice)}</p>
    </td></tr>
  </table>`;
}

// ── Content blocks ──────────────────────────────────────────────────────────

export function heading(text: string): string {
  return `<h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.025em;color:${color.ink};">${esc(text)}</h1>`;
}

/** `html` is raw on purpose so copy can carry <strong> — callers escape their own variables. */
export function paragraph(html: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${color.muted};">${html}</p>`;
}

export function button(label: string, url: string): string {
  // A bulletproof-ish button: <a> with padding inside a table cell. VML would
  // add Outlook rounding, at the cost of doubling this block — the square-ish
  // fallback Outlook renders is an acceptable trade.
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 8px;">
    <tr><td align="center" style="background:${color.blue600};border-radius:${theme.size.radiusSm}px;">
      <a href="${url}" style="display:inline-block;padding:14px 28px;color:${color.paper};font-size:15px;font-weight:600;text-decoration:none;font-family:${font.body};">${esc(label)}</a>
    </td></tr>
  </table>`;
}

export function secondaryLink(label: string, url: string): string {
  return `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:${color.muted};">
    <a href="${url}" style="color:${color.blue600};text-decoration:none;font-weight:600;">${esc(label)}</a>
  </p>`;
}

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

export function alert(tone: AlertTone, html: string): string {
  const tones: Record<AlertTone, { bg: string; fg: string }> = {
    info: { bg: color.blue100, fg: color.navy900 },
    success: { bg: color.okSoft, fg: '#05603a' },
    warning: { bg: color.warnSoft, fg: color.warn },
    danger: { bg: color.dangerSoft, fg: color.danger },
  };
  const { bg, fg } = tones[tone];

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
    <tr><td style="background:${bg};border-radius:${theme.size.radiusSm}px;padding:14px 16px;">
      <p style="margin:0;font-size:14px;line-height:1.6;color:${fg};">${html}</p>
    </td></tr>
  </table>`;
}

export function card(title: string, rows: { label: string; value: string }[]): string {
  const body = rows
    .map(
      (row, i) => `<tr>
        <td style="padding:${i === 0 ? '0' : '9px'} 0 0;font-size:13px;color:${color.faint};">${esc(row.label)}</td>
        <td align="right" style="padding:${i === 0 ? '0' : '9px'} 0 0;font-size:14px;font-weight:600;color:${color.ink};">${esc(row.value)}</td>
      </tr>`,
    )
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
    <tr><td style="background:${color.mist};border:1px solid ${color.line};border-radius:${theme.size.radiusSm}px;padding:18px 20px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:${color.faint};">${esc(title)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${body}</table>
    </td></tr>
  </table>`;
}

/** Ordered steps — used by the Pix instructions, where order genuinely matters. */
export function steps(items: string[]): string {
  const body = items
    .map(
      (item, i) => `<tr>
        <td width="26" valign="top" style="padding:0 0 10px;">
          <span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${color.navy900};color:${color.paper};font-size:11px;font-weight:700;text-align:center;line-height:20px;">${i + 1}</span>
        </td>
        <td valign="top" style="padding:1px 0 10px;font-size:14px;line-height:1.55;color:${color.muted};">${item}</td>
      </tr>`,
    )
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">${body}</table>`;
}

/** A value meant to be copied — a Pix key. Monospace and breakable so long keys never overflow. */
export function copyValue(label: string, value: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
    <tr><td style="background:${color.paper};border:1px solid ${color.line};border-radius:${theme.size.radiusSm}px;padding:14px 16px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${color.faint};">${esc(label)}</p>
      <p style="margin:0;font-size:17px;font-weight:700;color:${color.ink};word-break:break-all;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${esc(value)}</p>
    </td></tr>
  </table>`;
}

export function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 20px;">
    <tr><td style="border-top:1px solid ${color.lineSoft};font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>`;
}
