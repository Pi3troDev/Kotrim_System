import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FinancialStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { addDays, addInterval, startOfToday } from '../../common/utils/date.util';

export interface RecurringGenerationResult {
  expensesCreated: number;
  incomesCreated: number;
}

export interface DueDateAlertsResult {
  expenseAlerts: number;
  incomeAlerts: number;
}

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs once a day. Pinned to America/Sao_Paulo explicitly — an implicit
   * server-local cron would silently fire at the wrong wall-clock time on a
   * host whose default timezone is UTC (the common case on most PaaS).
   */
  @Cron('0 3 * * *', { name: 'daily-finance-tasks', timeZone: 'America/Sao_Paulo' })
  async runDailyTasks(): Promise<void> {
    const recurring = await this.runRecurringGeneration();
    const alerts = await this.runDueDateAlerts();
    this.logger.log(
      `Daily finance tasks: ${recurring.expensesCreated} expenses + ${recurring.incomesCreated} incomes generated; ` +
        `${alerts.expenseAlerts + alerts.incomeAlerts} due-date notifications sent.`,
    );
  }

  /** Exposed for the manual-trigger endpoint — safe to call anytime, both loops are idempotent exact-match queries. */
  async runRecurringGeneration(): Promise<RecurringGenerationResult> {
    const [expensesCreated, incomesCreated] = await Promise.all([
      this.generateRecurringExpenses(),
      this.generateRecurringIncomes(),
    ]);
    return { expensesCreated, incomesCreated };
  }

  /** Exposed for the manual-trigger endpoint. */
  async runDueDateAlerts(): Promise<DueDateAlertsResult> {
    const [expenseAlerts, incomeAlerts] = await Promise.all([
      this.sendExpenseDueDateAlerts(),
      this.sendIncomeDueDateAlerts(),
    ]);
    return { expenseAlerts, incomeAlerts };
  }

  private async generateRecurringExpenses(): Promise<number> {
    const groups = await this.prisma.expense.groupBy({
      by: ['recurringGroupId'],
      where: { recurringGroupId: { not: null }, recurrenceFrequency: { not: null }, deletedAt: null },
      _max: { dueDate: true },
    });

    const today = startOfToday();
    let created = 0;

    for (const group of groups) {
      if (!group.recurringGroupId || !group._max.dueDate) continue;

      const latest = await this.prisma.expense.findFirst({
        where: { recurringGroupId: group.recurringGroupId, dueDate: group._max.dueDate, deletedAt: null },
      });
      if (!latest || !latest.recurrenceFrequency || latest.dueDate > today) continue;

      const nextDueDate = addInterval(latest.dueDate, latest.recurrenceFrequency, 1);
      if (latest.recurrenceEndDate && nextDueDate > latest.recurrenceEndDate) continue;

      await this.prisma.expense.create({
        data: {
          companyId: latest.companyId,
          description: latest.description,
          amount: latest.amount,
          dueDate: nextDueDate,
          paymentMethod: latest.paymentMethod,
          categoryId: latest.categoryId,
          accountId: latest.accountId,
          recurrenceFrequency: latest.recurrenceFrequency,
          recurringGroupId: latest.recurringGroupId,
          recurrenceEndDate: latest.recurrenceEndDate,
        },
      });
      created++;
    }

    return created;
  }

  private async generateRecurringIncomes(): Promise<number> {
    const groups = await this.prisma.income.groupBy({
      by: ['recurringGroupId'],
      where: { recurringGroupId: { not: null }, recurrenceFrequency: { not: null }, deletedAt: null },
      _max: { dueDate: true },
    });

    const today = startOfToday();
    let created = 0;

    for (const group of groups) {
      if (!group.recurringGroupId || !group._max.dueDate) continue;

      const latest = await this.prisma.income.findFirst({
        where: { recurringGroupId: group.recurringGroupId, dueDate: group._max.dueDate, deletedAt: null },
      });
      if (!latest || !latest.recurrenceFrequency || latest.dueDate > today) continue;

      const nextDueDate = addInterval(latest.dueDate, latest.recurrenceFrequency, 1);
      if (latest.recurrenceEndDate && nextDueDate > latest.recurrenceEndDate) continue;

      await this.prisma.income.create({
        data: {
          companyId: latest.companyId,
          description: latest.description,
          amount: latest.amount,
          dueDate: nextDueDate,
          paymentMethod: latest.paymentMethod,
          categoryId: latest.categoryId,
          clientId: latest.clientId,
          accountId: latest.accountId,
          recurrenceFrequency: latest.recurrenceFrequency,
          recurringGroupId: latest.recurringGroupId,
          recurrenceEndDate: latest.recurrenceEndDate,
        },
      });
      created++;
    }

    return created;
  }

  private async sendExpenseDueDateAlerts(): Promise<number> {
    const today = startOfToday();
    const dueSoonDate = addDays(today, 3);
    const overdueDate = addDays(today, -1);

    const [dueSoon, overdue] = await Promise.all([
      this.prisma.expense.findMany({ where: { status: FinancialStatus.PENDING, dueDate: dueSoonDate, deletedAt: null } }),
      this.prisma.expense.findMany({ where: { status: FinancialStatus.PENDING, dueDate: overdueDate, deletedAt: null } }),
    ]);

    let count = 0;
    for (const expense of dueSoon) {
      count += await this.notifyCompany(
        expense.companyId,
        NotificationType.WARNING,
        'Despesa vence em 3 dias',
        `"${expense.description}" vence em 3 dias.`,
        '/finance',
      );
    }
    for (const expense of overdue) {
      count += await this.notifyCompany(
        expense.companyId,
        NotificationType.ERROR,
        'Despesa vencida',
        `"${expense.description}" está vencida.`,
        '/finance',
      );
    }

    return count;
  }

  private async sendIncomeDueDateAlerts(): Promise<number> {
    const today = startOfToday();
    const dueSoonDate = addDays(today, 3);
    const overdueDate = addDays(today, -1);

    const [dueSoon, overdue] = await Promise.all([
      this.prisma.income.findMany({ where: { status: FinancialStatus.PENDING, dueDate: dueSoonDate, deletedAt: null } }),
      this.prisma.income.findMany({ where: { status: FinancialStatus.PENDING, dueDate: overdueDate, deletedAt: null } }),
    ]);

    let count = 0;
    for (const income of dueSoon) {
      count += await this.notifyCompany(
        income.companyId,
        NotificationType.WARNING,
        'Receita vence em 3 dias',
        `"${income.description}" vence em 3 dias.`,
        '/finance/income',
      );
    }
    for (const income of overdue) {
      count += await this.notifyCompany(
        income.companyId,
        NotificationType.ERROR,
        'Receita vencida',
        `"${income.description}" está vencida.`,
        '/finance/income',
      );
    }

    return count;
  }

  /** One notification row per active user of the company, via a single createMany. */
  private async notifyCompany(
    companyId: string,
    type: NotificationType,
    title: string,
    message: string,
    link: string,
  ): Promise<number> {
    const users = await this.prisma.user.findMany({
      where: { companyId, deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (users.length === 0) return 0;

    const result = await this.prisma.notification.createMany({
      data: users.map((user) => ({ companyId, userId: user.id, type, title, message, link })),
    });

    return result.count;
  }
}
