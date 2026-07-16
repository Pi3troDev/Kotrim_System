import { PrismaService } from '../../prisma/prisma.service';
export interface RecurringGenerationResult {
    expensesCreated: number;
    incomesCreated: number;
}
export interface DueDateAlertsResult {
    expenseAlerts: number;
    incomeAlerts: number;
}
export declare class ScheduledTasksService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    runDailyTasks(): Promise<void>;
    runRecurringGeneration(): Promise<RecurringGenerationResult>;
    runDueDateAlerts(): Promise<DueDateAlertsResult>;
    private generateRecurringExpenses;
    private generateRecurringIncomes;
    private sendExpenseDueDateAlerts;
    private sendIncomeDueDateAlerts;
    private notifyCompany;
}
