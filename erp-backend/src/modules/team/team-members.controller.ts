import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Client } from '../../common/decorators/client-info.decorator';
import type { ClientInfo } from '../../common/decorators/client-info.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { TeamMembersService } from './team-members.service';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

/**
 * Managed by the workshop's own Admin, not by Kotrim staff — see AdminController
 * for the platform-level equivalent. Every route here is scoped to the caller's
 * own company; there is no cross-tenant listing.
 */
@ApiTags('team-members')
@Controller('team-members')
@Roles('Admin')
export class TeamMembersController {
  constructor(private readonly teamMembersService: TeamMembersService) {}

  @Get()
  @ApiOperation({ summary: "List the company's logins" })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.teamMembersService.list(user.companyId);
  }

  @Get('cargos')
  @ApiOperation({ summary: 'List job-title presets available for invites, given the current plan' })
  listCargos(@CurrentUser() user: AuthenticatedUser) {
    return this.teamMembersService.listCargos(user.companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Invite a team member — creates the login and e-mails a setup link' })
  invite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteTeamMemberDto,
    @Client() client: ClientInfo,
  ) {
    return this.teamMembersService.invite(user.companyId, dto, user, client);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Deactivate or reactivate a team member' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTeamMemberDto,
    @Client() client: ClientInfo,
  ) {
    return this.teamMembersService.update(user.companyId, id, dto, user, client);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a team member (soft delete — audit trail is kept)' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Client() client: ClientInfo) {
    return this.teamMembersService.remove(user.companyId, id, user, client);
  }

  @Post(':id/resend-invite')
  @ApiOperation({ summary: 'Re-issue the setup link for an invite that has not been claimed yet' })
  resendInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Client() client: ClientInfo,
  ) {
    return this.teamMembersService.resendInvite(user.companyId, id, user, client);
  }
}
