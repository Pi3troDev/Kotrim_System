import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { DashboardService } from './dashboard.service';
import { DashboardSummary } from './interfaces/dashboard-summary.interface';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Aggregated KPIs and trends for the authenticated company' })
  getSummary(@CurrentUser() user: AuthenticatedUser): Promise<DashboardSummary> {
    return this.dashboardService.getSummary(user.companyId);
  }
}
