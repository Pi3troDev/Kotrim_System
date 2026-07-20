import { Injectable, Logger } from '@nestjs/common';
import { MailProvider, OutgoingMail, SendResult } from '../mail-provider.interface';

/**
 * Logs the message instead of sending it.
 *
 * The default when no provider is configured, and the reason the password-reset
 * flow is usable without one: the link lands in the server log and the flow is
 * otherwise identical to production.
 *
 * Deliberately loud — a mail silently going nowhere is worse than a noisy log.
 */
@Injectable()
export class ConsoleMailProvider implements MailProvider {
  readonly key = 'console';
  readonly delivers = false;

  private readonly logger = new Logger('Mail');

  async send(message: OutgoingMail): Promise<SendResult> {
    const divider = '─'.repeat(72);
    this.logger.log(
      `\n${divider}\n` +
        `E-MAIL NÃO ENVIADO — provedor "console" (nada saiu daqui)\n` +
        `${divider}\n` +
        `Para:    ${message.to}\n` +
        `Assunto: ${message.subject}\n` +
        `${divider}\n` +
        `${message.text}\n` +
        `${divider}`,
    );

    return { providerMessageId: null };
  }
}
