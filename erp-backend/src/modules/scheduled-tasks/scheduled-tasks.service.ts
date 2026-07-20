import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FinancialStatus, NotificationType, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailRecipient, MailService } from '../mail/mail.service';
import { addDays, addInterval, startOfToday } from '../../common/utils/date.util';

export interface RecurringGenerationResult {
  expensesCreated: number;
  incomesCreated: number;
}

export interface DueDateAlertsResult {
  expenseAlerts: number;
  incomeAlerts: number;
}

export interface SubscriptionSweepResult {
  trialsExpired: number;
  subscriptionsExpired: number;
  trialAlerts: number;
}

/**
 * Days before a trial ends that we warn the workshop.
 *
 * One warning, at two days: enough time to decide and pay, close enough to feel
 * real. A second reminder a day later would read as nagging on a 7-day trial.
 * Add entries here if that turns out to be wrong — the loop below handles any
 * number of them.
 */
const TRIAL_WARNING_DAYS = [2];

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Runs once a day. Pinned to America/Sao_Paulo explicitly — an implicit
   * server-local cron would silently fire at the wrong wall-clock time on a
   * host whose default timezone is UTC (the common case on most PaaS).
   */
  @Cron('0 3 * * *', { name: 'daily-finance-tasks', timeZone: 'America/Sao_Paulo' })
  async runDailyTasks(): Promise<void> {
    const recurring = await this.runRecurringGeneration();
    const alerts = await this.runDueDateAlerts();
    const subscriptions = await this.runSubscriptionSweep();
    this.logger.log(
      `Daily finance tasks: ${recurring.expensesCreated} expenses + ${recurring.incomesCreated} incomes generated; ` +
        `${alerts.expenseAlerts + alerts.incomeAlerts} due-date notifications sent.`,
    );
    this.logger.log(
      `Subscription sweep: ${subscriptions.trialsExpired} trials + ${subscriptions.subscriptionsExpired} paid subscriptions expired; ` +
        `${subscriptions.trialAlerts} trial-ending notifications sent.`,
    );
  }

  /**
   * Bulk-expires lapsed subscriptions and warns trials that are about to end.
   *
   * `SubscriptionAccessService` also expires a lapsed row on read, so access is
   * never wrongly granted between runs. This job exists so the admin panel
   * shows accurate statuses without someone having to log in first, and so the
   * warnings actually go out.
   */
  async runSubscriptionSweep(): Promise<SubscriptionSweepResult> {
    const now = new Date();

    // Collected before the bulk update: afterwards these rows are
    // indistinguishable from companies that expired weeks ago, and everyone
    // would get the "your trial ended" mail on every run.
    const trialsAboutToExpire = await this.prisma.subscription.findMany({
      where: { status: SubscriptionStatus.TRIAL, trialEndsAt: { lte: now } },
      select: { companyId: true },
    });

    const [trials, paid] = await Promise.all([
      this.prisma.subscription.updateMany({
        where: { status: SubscriptionStatus.TRIAL, trialEndsAt: { lte: now } },
        data: { status: SubscriptionStatus.EXPIRED },
      }),
      this.prisma.subscription.updateMany({
        where: { status: SubscriptionStatus.ACTIVE, currentPeriodEnd: { lte: now } },
        data: { status: SubscriptionStatus.EXPIRED },
      }),
    ]);

    for (const subscription of trialsAboutToExpire) {
      await this.mailCompanyAdmin(subscription.companyId, (recipient, companyName) =>
        this.mailService.trialExpired(recipient, { name: recipient.name, companyName }),
      );
    }

    return {
      trialsExpired: trials.count,
      subscriptionsExpired: paid.count,
      trialAlerts: await this.sendTrialEndingAlerts(),
    };
  }

  /**
   * Resolves the company's oldest active user — the admin created at signup —
   * and hands the caller a ready recipient, so every mail from this service is
   * filed against the right company and user in MailLog.
   */
  private async mailCompanyAdmin(
    companyId: string,
    send: (recipient: MailRecipient, companyName: string) => void,
  ): Promise<void> {
    const admin = await this.prisma.user.findFirst({
      where: { companyId, deletedAt: null, isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, email: true, name: true, company: { select: { name: true } } },
    });
    if (!admin) return;

    send(
      { email: admin.email, name: admin.name, userId: admin.id, companyId },
      admin.company.name,
    );
  }

  private async sendTrialEndingAlerts(): Promise<number> {
    const today = startOfToday();
    let count = 0;

    for (const daysLeft of TRIAL_WARNING_DAYS) {
      // Exact-day match on the date boundary, mirroring how the due-date alerts
      // above avoid re-notifying the same subscription every single day.
      const targetDay = addDays(today, daysLeft);
      const subscriptions = await this.prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.TRIAL,
          trialEndsAt: { gte: targetDay, lt: addDays(targetDay, 1) },
        },
        select: { companyId: true, trialEndsAt: true },
      });

      for (const subscription of subscriptions) {
        await this.mailCompanyAdmin(subscription.companyId, (recipient, companyName) =>
          this.mailService.trialEnding(recipient, {
            name: recipient.name,
            companyName,
            daysLeft,
            trialEndsAt: subscription.trialEndsAt!,
          }),
        );

        count += await this.notifyCompany(
          subscription.companyId,
          NotificationType.WARNING,
          daysLeft === 1 ? 'Seu teste grátis termina amanhã' : `Seu teste grátis termina em ${daysLeft} dias`,
          'Escolha um plano para continuar usando o Kotrim sem interrupção.',
          '/subscription',
        );
      }
    }

    return count;
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
