/**
 * The contract every mail transport implements.
 *
 * Same shape as the billing provider layer, and for the same reason: swapping
 * Resend for SES is a new class and one line in MailModule. Nothing that *sends*
 * mail — auth, billing, the cron — knows which transport it got.
 */
export interface MailProvider {
  readonly key: string;
  /** Whether this transport actually delivers. False for the console one. */
  readonly delivers: boolean;
  send(message: OutgoingMail): Promise<SendResult>;
}

export interface OutgoingMail {
  to: string;
  subject: string;
  /** Rendered HTML body. */
  html: string;
  /** Plain-text fallback. Always sent: some clients refuse HTML, and a text part improves deliverability. */
  text: string;
  /** Blind copies. The recipient never sees these — they are for Kotrim staff. */
  bcc?: string[];
  /** Images embedded in the message body and referenced as `cid:<cid>`. */
  inlineImages?: InlineImage[];
}

/**
 * An image carried inside the message rather than fetched from a URL.
 *
 * The logo has to be one: a `src="https://kotrim.com.br/..."` only resolves once
 * that site is deployed, and a data: URI is stripped by Gmail. An inline
 * attachment renders in every client and depends on nothing.
 */
export interface InlineImage {
  /** Referenced from the HTML as `cid:<cid>`. */
  cid: string;
  filename: string;
  /** Base64, without a data: prefix. */
  content: string;
}

export interface SendResult {
  /** The transport's own id, for reconciling against the provider dashboard later. */
  providerMessageId: string | null;
}

/** DI token for the transport. */
export const MAIL_PROVIDER = Symbol('MAIL_PROVIDER');
