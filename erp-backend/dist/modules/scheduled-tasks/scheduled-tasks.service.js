"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ScheduledTasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledTasksService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const date_util_1 = require("../../common/utils/date.util");
let ScheduledTasksService = ScheduledTasksService_1 = class ScheduledTasksService {
    prisma;
    logger = new common_1.Logger(ScheduledTasksService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async runDailyTasks() {
        const recurring = await this.runRecurringGeneration();
        const alerts = await this.runDueDateAlerts();
        this.logger.log(`Daily finance tasks: ${recurring.expensesCreated} expenses + ${recurring.incomesCreated} incomes generated; ` +
            `${alerts.expenseAlerts + alerts.incomeAlerts} due-date notifications sent.`);
    }
    async runRecurringGeneration() {
        const [expensesCreated, incomesCreated] = await Promise.all([
            this.generateRecurringExpenses(),
            this.generateRecurringIncomes(),
        ]);
        return { expensesCreated, incomesCreated };
    }
    async runDueDateAlerts() {
        const [expenseAlerts, incomeAlerts] = await Promise.all([
            this.sendExpenseDueDateAlerts(),
            this.sendIncomeDueDateAlerts(),
        ]);
        return { expenseAlerts, incomeAlerts };
    }
    async generateRecurringExpenses() {
        const groups = await this.prisma.expense.groupBy({
            by: ['recurringGroupId'],
            where: { recurringGroupId: { not: null }, recurrenceFrequency: { not: null }, deletedAt: null },
            _max: { dueDate: true },
        });
        const today = (0, date_util_1.startOfToday)();
        let created = 0;
        for (const group of groups) {
            if (!group.recurringGroupId || !group._max.dueDate)
                continue;
            const latest = await this.prisma.expense.findFirst({
                where: { recurringGroupId: group.recurringGroupId, dueDate: group._max.dueDate, deletedAt: null },
            });
            if (!latest || !latest.recurrenceFrequency || latest.dueDate > today)
                continue;
            const nextDueDate = (0, date_util_1.addInterval)(latest.dueDate, latest.recurrenceFrequency, 1);
            if (latest.recurrenceEndDate && nextDueDate > latest.recurrenceEndDate)
                continue;
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
    async generateRecurringIncomes() {
        const groups = await this.prisma.income.groupBy({
            by: ['recurringGroupId'],
            where: { recurringGroupId: { not: null }, recurrenceFrequency: { not: null }, deletedAt: null },
            _max: { dueDate: true },
        });
        const today = (0, date_util_1.startOfToday)();
        let created = 0;
        for (const group of groups) {
            if (!group.recurringGroupId || !group._max.dueDate)
                continue;
            const latest = await this.prisma.income.findFirst({
                where: { recurringGroupId: group.recurringGroupId, dueDate: group._max.dueDate, deletedAt: null },
            });
            if (!latest || !latest.recurrenceFrequency || latest.dueDate > today)
                continue;
            const nextDueDate = (0, date_util_1.addInterval)(latest.dueDate, latest.recurrenceFrequency, 1);
            if (latest.recurrenceEndDate && nextDueDate > latest.recurrenceEndDate)
                continue;
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
    async sendExpenseDueDateAlerts() {
        const today = (0, date_util_1.startOfToday)();
        const dueSoonDate = (0, date_util_1.addDays)(today, 3);
        const overdueDate = (0, date_util_1.addDays)(today, -1);
        const [dueSoon, overdue] = await Promise.all([
            this.prisma.expense.findMany({ where: { status: client_1.FinancialStatus.PENDING, dueDate: dueSoonDate, deletedAt: null } }),
            this.prisma.expense.findMany({ where: { status: client_1.FinancialStatus.PENDING, dueDate: overdueDate, deletedAt: null } }),
        ]);
        let count = 0;
        for (const expense of dueSoon) {
            count += await this.notifyCompany(expense.companyId, client_1.NotificationType.WARNING, 'Despesa vence em 3 dias', `"${expense.description}" vence em 3 dias.`, '/finance');
        }
        for (const expense of overdue) {
            count += await this.notifyCompany(expense.companyId, client_1.NotificationType.ERROR, 'Despesa vencida', `"${expense.description}" está vencida.`, '/finance');
        }
        return count;
    }
    async sendIncomeDueDateAlerts() {
        const today = (0, date_util_1.startOfToday)();
        const dueSoonDate = (0, date_util_1.addDays)(today, 3);
        const overdueDate = (0, date_util_1.addDays)(today, -1);
        const [dueSoon, overdue] = await Promise.all([
            this.prisma.income.findMany({ where: { status: client_1.FinancialStatus.PENDING, dueDate: dueSoonDate, deletedAt: null } }),
            this.prisma.income.findMany({ where: { status: client_1.FinancialStatus.PENDING, dueDate: overdueDate, deletedAt: null } }),
        ]);
        let count = 0;
        for (const income of dueSoon) {
            count += await this.notifyCompany(income.companyId, client_1.NotificationType.WARNING, 'Receita vence em 3 dias', `"${income.description}" vence em 3 dias.`, '/finance/income');
        }
        for (const income of overdue) {
            count += await this.notifyCompany(income.companyId, client_1.NotificationType.ERROR, 'Receita vencida', `"${income.description}" está vencida.`, '/finance/income');
        }
        return count;
    }
    async notifyCompany(companyId, type, title, message, link) {
        const users = await this.prisma.user.findMany({
            where: { companyId, deletedAt: null, isActive: true },
            select: { id: true },
        });
        if (users.length === 0)
            return 0;
        const result = await this.prisma.notification.createMany({
            data: users.map((user) => ({ companyId, userId: user.id, type, title, message, link })),
        });
        return result.count;
    }
};
exports.ScheduledTasksService = ScheduledTasksService;
__decorate([
    (0, schedule_1.Cron)('0 3 * * *', { name: 'daily-finance-tasks', timeZone: 'America/Sao_Paulo' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScheduledTasksService.prototype, "runDailyTasks", null);
exports.ScheduledTasksService = ScheduledTasksService = ScheduledTasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ScheduledTasksService);
//# sourceMappingURL=scheduled-tasks.service.js.map