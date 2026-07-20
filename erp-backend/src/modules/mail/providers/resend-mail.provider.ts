import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { MailProvider, OutgoingMail, SendResult } from '../mail-provider.interface';

/**
 * Delivery through Resend.
 *
 * Knows nothing about Kotrim's events, templates, or logging — it takes a
 * rendered message and hands back the provider's id. Everything above it is
 * transport-agnostic by construction.
 */
@Injectable()
export class ResendMailProvider implements MailProvider {
  readonly key = 'resend';
  readonly delivers = true;

  private readonly logger = new Logger(ResendMailProvider.name);
  private readonly client: Resend;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('mail.resendApiKey');
    if (!apiKey) {
      // Reached only if MAIL_PROVIDER=resend without a key. Failing at boot
      // beats discovering it when the first customer does not get a welcome.
      throw new Error('MAIL_PROVIDER is "resend" but RESEND_API_KEY is not set.');
    }

    this.client = new Resend(apiKey);
    this.from = this.configService.get<string>('mail.from')!;
  }

  async send(message: OutgoingMail): Promise<SendResult> {
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: [message.to],
      bcc: message.bcc?.length ? message.bcc : undefined,
      subject: message.subject,
      html: message.html,
      text: message.text,
      // An attachment carrying a content_id is rendered inline where the HTML
      // says cid:<id>, rather than shown as a download.
      attachments: message.inlineImages?.map((image) => ({
        filename: image.filename,
        content: image.content,
        contentId: image.cid,
      })),
    });

    if (error) {
      // Resend reports failures in the body rather than by throwing, so an
      // unchecked call looks like a success and the message quietly never
      // arrives. Rethrown here so MailService can log it as FAILED.
      this.logger.error(`Resend rejected "${message.subject}" to ${message.to}: ${error.message}`);
      throw new Error(`${error.name}: ${error.message}`);
    }

    return { providerMessageId: data?.id ?? null };
  }
}
