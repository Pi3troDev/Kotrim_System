import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScheduledTasksService } from './scheduled-tasks.service';

/** Manual triggers for the daily cron jobs — lets us verify/operate them without waiting for real dates. */
@ApiTags('scheduled-tasks')
@Controller('scheduled-tasks')
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
}
