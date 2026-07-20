import { MailLocale } from './template.types';

/**
 * Formatting helpers, locale-aware from day one.
 *
 * Not because pt-BR needs the indirection today, but because dates and money are
 * exactly where a hardcoded assumption hides: `dd/MM/yyyy` and `R$ 1.499,80` are
 * the two things that would silently stay Brazilian in an English e-mail.
 */

const INTL_LOCALE: Record<MailLocale, string> = {
  'pt-BR': 'pt-BR',
};

const CURRENCY: Record<MailLocale, string> = {
  'pt-BR': 'BRL',
};

export function formatDate(date: Date, locale: MailLocale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatShortDate(date: Date, locale: MailLocale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatMoney(cents: number, locale: MailLocale): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: 'currency',
    currency: CURRENCY[locale],
  }).format(cents / 100);
}

/** First name only — "Olá, José Carlos da Silva Junior" reads like a form letter. */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}
