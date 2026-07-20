import { Body, Controller, Get, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { SettingsService, COMPANY_LOGO_UPLOAD_OPTIONS } from './settings.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('company')
  @ApiOperation({ summary: "Get the current user's company profile/settings" })
  getCompany(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.getCompany(user.companyId);
  }

  @Patch('company')
  @Roles('Admin')
  @ApiOperation({ summary: 'Update company profile, workshop hours and work days (Admin only)' })
  updateCompany(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateCompanySettingsDto) {
    return this.settingsService.updateCompany(user.companyId, dto);
  }

  @Post('company/logo')
  @Roles('Admin')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload the company logo (Admin only)' })
  @UseInterceptors(FileInterceptor('file', COMPANY_LOGO_UPLOAD_OPTIONS))
  updateLogo(@CurrentUser() user: AuthenticatedUser, @UploadedFile() file: Express.Multer.File) {
    return this.settingsService.updateLogo(user.companyId, file);
  }
}
