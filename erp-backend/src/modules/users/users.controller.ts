import { Body, Controller, Get, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SkipSubscription } from '../../common/decorators/skip-subscription.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UsersService, USER_AVATAR_UPLOAD_OPTIONS } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

/**
 * `@SkipSubscription`: a locked-out company still lands on the subscription
 * page, which greets the user by name and shows their avatar. Gating "who am I"
 * behind an active subscription would blank out that page.
 */
@ApiTags('users')
@Controller('users')
@SkipSubscription()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: "Get the current user's own profile" })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: "Update the current user's own profile" })
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: "Upload the current user's avatar" })
  @UseInterceptors(FileInterceptor('file', USER_AVATAR_UPLOAD_OPTIONS))
  updateAvatar(@CurrentUser() user: AuthenticatedUser, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.updateAvatar(user.id, file);
  }
}
