import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/**
 * Global for the same reason MailModule is: the actions worth auditing are
 * spread across auth, billing and admin by nature, and threading an import
 * through each of them buys nothing.
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
