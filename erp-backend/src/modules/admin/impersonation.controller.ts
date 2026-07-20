import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Client } from '../../common/decorators/client-info.decorator';
import type { ClientInfo } from '../../common/decorators/client-info.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { SkipSubscription } from '../../common/decorators/skip-subscription.decorator';
import { ImpersonationService } from './impersonation.service';

/**
 * Separate from AdminController on purpose.
 *
 * AdminController is `@SuperAdmin()`-wide, and the caller here is *not* a
 * super-admin: they are holding an impersonated token, whose whole point is that
 * the flag is off. Ending a session from inside it would be impossible on that
 * controller.
 *
 * `@SkipSubscription` because the impersonated company may well be expired —
 * that is often exactly why support is looking.
 */
@ApiTags('admin')
@Controller('admin/impersonate')
@SkipSubscription()
export class ImpersonationController {
  constructor(private readonly impersonationService: ImpersonationService) {}

  @Post('end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close the support session in the audit trail' })
  end(@CurrentUser() user: AuthenticatedUser, @Client() client: ClientInfo): Promise<{ ok: true }> {
    return this.impersonationService.end(user, client);
  }
}
