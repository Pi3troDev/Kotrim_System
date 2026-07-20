import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlanFeatures } from '../../common/decorators/plan-features.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { DashboardService } from './dashboard.service';
import { DashboardSummary } from './interfaces/dashboard-summary.interface';
import { RequiresFeature } from '../../common/decorators/requires-feature.decorator';
import { PlanFeature } from '../billing/plan-features';

@ApiTags('dashboard')
@RequiresFeature(PlanFeature.DASHBOARD)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Aggregated KPIs and trends for the authenticated company',
    description:
      'Financial and stock sections come back null when the plan does not include FINANCE / INVENTORY.',
  })
  getSummary(
    @CurrentUser() user: AuthenticatedUser,
    @PlanFeatures() features: PlanFeature[],
  ): Promise<DashboardSummary> {
    return this.dashboardService.getSummary(user.companyId, features);
  }
}
