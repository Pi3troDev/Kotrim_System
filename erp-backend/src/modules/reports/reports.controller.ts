import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ReportsService } from './reports.service';
import { ReportDateRangeQueryDto } from './dto/report-date-range-query.dto';
import { RequiresFeature } from '../../common/decorators/requires-feature.decorator';
import { PlanFeature } from '../billing/plan-features';

@ApiTags('reports')
@RequiresFeature(PlanFeature.REPORTS)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('finance')
  @ApiOperation({ summary: 'Revenue vs expenses over a date range, monthly series, totals by category' })
  getFinanceReport(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportDateRangeQueryDto) {
    return this.reportsService.getFinanceReport(user.companyId, query);
  }

  @Get('work-orders')
  @ApiOperation({ summary: 'Work orders by status, revenue/average ticket, mechanic ranking over a date range' })
  getWorkOrdersReport(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportDateRangeQueryDto) {
    return this.reportsService.getWorkOrdersReport(user.companyId, query);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Stock value, low stock items, most-moved items over a date range' })
  getInventoryReport(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportDateRangeQueryDto) {
    return this.reportsService.getInventoryReport(user.companyId, query);
  }
}
