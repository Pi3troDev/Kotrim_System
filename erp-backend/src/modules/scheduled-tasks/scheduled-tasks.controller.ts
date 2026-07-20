import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipSubscription } from '../../common/decorators/skip-subscription.decorator';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';
import { ScheduledTasksService } from './scheduled-tasks.service';

/**
 * Manual triggers for the daily cron jobs — lets us verify/operate them without
 * waiting for real dates.
 *
 * Super-admin only: every job here sweeps *all* companies, so exposing it to a
 * workshop user would let one tenant kick off work across every other tenant.
 */
@ApiTags('scheduled-tasks')
@Controller('scheduled-tasks')
@SuperAdmin()
@SkipSubscription()
export class ScheduledTasksController {
  constructor(private readonly scheduledTasksService: ScheduledTasksService) {}

  @Post('run-recurring')
  @ApiOperation({ summary: 'Manually run recurring expense/income generation for all companies' })
  runRecurring() {
    return this.scheduledTasksService.runRecurringGeneration();
  }

  @Post('run-due-date-alerts')
  @ApiOperation({ summary: 'Manually run due-date notification generation for all companies' })
  runDueDateAlerts() {
    return this.scheduledTasksService.runDueDateAlerts();
  }

  @Post('run-subscription-sweep')
  @ApiOperation({ summary: 'Manually expire lapsed subscriptions and send trial-ending alerts' })
  runSubscriptionSweep() {
    return this.scheduledTasksService.runSubscriptionSweep();
  }
}
