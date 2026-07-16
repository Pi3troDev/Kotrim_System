import { ScheduledTasksService } from './scheduled-tasks.service';
export declare class ScheduledTasksController {
    private readonly scheduledTasksService;
    constructor(scheduledTasksService: ScheduledTasksService);
    runRecurring(): Promise<import("./scheduled-tasks.service").RecurringGenerationResult>;
    runDueDateAlerts(): Promise<import("./scheduled-tasks.service").DueDateAlertsResult>;
}
