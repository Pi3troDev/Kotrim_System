import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MAIL_PROVIDER } from './mail-provider.interface';
import type { MailProvider } from './mail-provider.interface';
import { ConsoleMailProvider } from './providers/console-mail.provider';
import { ResendMailProvider } from './providers/resend-mail.provider';
import { MailService } from './mail.service';

/**
 * Global: the events that trigger mail (registration, activation, the nightly
 * sweep, password reset) are scattered across the app by nature, and threading
 * an import through every one of them buys nothing.
 *
 * Adding a provider is a class implementing `MailProvider` plus a branch in the
 * factory below. Nothing that sends mail changes — MailService only ever sees
 * the interface.
 */
@Global()
@Module({
  providers: [
    ConsoleMailProvider,
    MailService,
    {
      provide: MAIL_PROVIDER,
      // ResendMailProvider is constructed here rather than injected: its
      // constructor refuses to exist without an API key, and Nest would
      // instantiate it eagerly — crashing the boot of any machine running on
      // the console provider, which is exactly the machine least likely to have
      // a key.
      useFactory: (configService: ConfigService, consoleProvider: ConsoleMailProvider): MailProvider => {
        const logger = new Logger('MailModule');
        const provider = configService.get<'resend' | 'console'>('mail.provider');

        if (provider === 'resend') {
          const from = configService.get<string>('mail.from');
          const redirectTo = configService.get<string>('mail.redirectTo');
          logger.log(`Mail provider: resend (from: ${from})`);
          if (redirectTo) {
            // Loud on purpose: someone reading production logs must be able to
            // see at a glance that customers are not receiving anything.
            logger.warn(`Mail REDIRECT is on — every message goes to ${redirectTo}, not to the real recipient.`);
          }
          return new ResendMailProvider(configService);
        }

        logger.warn('Mail provider: console — messages are logged, not delivered. Set MAIL_PROVIDER=resend to send.');
        return consoleProvider;
      },
      inject: [ConfigService, ConsoleMailProvider],
    },
  ],
  exports: [MailService],
})
export class MailModule {}
