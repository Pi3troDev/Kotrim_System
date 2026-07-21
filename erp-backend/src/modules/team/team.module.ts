import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TeamMembersController } from './team-members.controller';
import { TeamMembersService } from './team-members.service';

/**
 * Imports AuthModule (not the reverse) to reach PasswordTokenService, so the
 * invite flow issues the exact same SETUP token AuthModule's own bootstrap
 * does — one redemption path (`/auth/password/setup`) for both.
 */
@Module({
  imports: [AuthModule],
  controllers: [TeamMembersController],
  providers: [TeamMembersService],
})
export class TeamModule {}
