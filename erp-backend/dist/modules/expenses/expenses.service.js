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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const paginated_result_interface_1 = require("../../common/interfaces/paginated-result.interface");
const date_util_1 = require("../../common/utils/date.util");
const expenseInclude = client_1.Prisma.validator()({
    include: {
        category: { select: { id: true, name: true } },
        account: { select: { id: true, name: true, type: true } },
    },
});
function toCents(value) {
    return Math.round(value * 100);
}
let ExpensesService = class ExpensesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(companyId, dto) {
        if (dto.installments && dto.recurrenceFrequency) {
            throw new common_1.BadRequestException('Não é possível parcelar e tornar recorrente ao mesmo tempo.');
        }
        if (dto.categoryId) {
            await this.assertCategoryBelongsToCompany(companyId, dto.categoryId);
        }
        if (dto.accountId) {
            await this.assertAccountBelongsToCompany(companyId, dto.accountId);
        }
        if (dto.installments && dto.installments > 1) {
            return this.createInstallments(companyId, dto);
        }
        const created = await this.prisma.expense.create({
            data: {
                companyId,
                description: dto.description,
                amount: dto.amount,
                dueDate: (0, date_util_1.parseLocalDate)(dto.dueDate),
                paymentMethod: dto.paymentMethod,
                categoryId: dto.categoryId,
                accountId: dto.accountId,
                recurrenceFrequency: dto.recurrenceFrequency,
                recurringGroupId: dto.recurrenceFrequency ? (0, node_crypto_1.randomUUID)() : undefined,
                recurrenceEndDate: dto.recurrenceEndDate ? (0, date_util_1.parseLocalDate)(dto.recurrenceEndDate) : undefined,
            },
            ...expenseInclude,
        });
        return [this.serialize(created)];
    }
    async stopRecurrence(companyId, id) {
        const expense = await this.prisma.expense.findFirst({ where: { id, companyId, deletedAt: null } });
        if (!expense) {
            throw new common_1.NotFoundException('Expense not found');
        }
        if (!expense.recurringGroupId) {
            throw new common_1.BadRequestException('Esta despesa não faz parte de uma série recorrente.');
        }
        await this.prisma.expense.updateMany({
            where: { recurringGroupId: expense.recurringGroupId, companyId, deletedAt: null },
            data: { recurrenceFrequency: null, recurrenceEndDate: null },
        });
    }
    async findAll(companyId, query) {
        const { page, limit, search, status, categoryId } = query;
        const where = {
            companyId,
            deletedAt: null,
            ...(categoryId && { categoryId }),
            ...this.buildStatusWhere(status),
            ...(search && { description: { contains: search, mode: 'insensitive' } }),
        };
        const [data, total] = await Promise.all([
            this.prisma.expense.findMany({
                where,
                orderBy: { dueDate: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
                ...expenseInclude,
            }),
            this.prisma.expense.count({ where }),
        ]);
        return (0, paginated_result_interface_1.paginate)(data.map((expense) => this.serialize(expense)), total, page, limit);
    }
    async summary(companyId) {
        const now = new Date();
        const today = (0, date_util_1.startOfToday)();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [pending, overdue, overdueCount, paidThisMonth] = await Promise.all([
            this.prisma.expense.aggregate({
                where: { companyId, deletedAt: null, status: client_1.FinancialStatus.PENDING, dueDate: { gte: today } },
                _sum: { amount: true },
            }),
            this.prisma.expense.aggregate({
                where: { companyId, deletedAt: null, status: client_1.FinancialStatus.PENDING, dueDate: { lt: today } },
                _sum: { amount: true },
            }),
            this.prisma.expense.count({
                where: { companyId, deletedAt: null, status: client_1.FinancialStatus.PENDING, dueDate: { lt: today } },
            }),
            this.prisma.expense.aggregate({
                where: { companyId, deletedAt: null, status: client_1.FinancialStatus.PAID, paidAt: { gte: monthStart } },
                _sum: { amount: true },
            }),
        ]);
        return {
            pendingTotal: Number(pending._sum.amount ?? 0),
            overdueTotal: Number(overdue._sum.amount ?? 0),
            overdueCount,
            paidThisMonthTotal: Number(paidThisMonth._sum.amount ?? 0),
        };
    }
    async findOne(companyId, id) {
        const expense = await this.prisma.expense.findFirst({ where: { id, companyId, deletedAt: null }, ...expenseInclude });
        if (!expense) {
            throw new common_1.NotFoundException('Expense not found');
        }
        return this.serialize(expense);
    }
    async update(companyId, id, dto) {
        await this.assertExpenseExists(companyId, id);
        if (dto.categoryId) {
            await this.assertCategoryBelongsToCompany(companyId, dto.categoryId);
        }
        if (dto.accountId) {
            await this.assertAccountBelongsToCompany(companyId, dto.accountId);
        }
        const updated = await this.prisma.expense.update({
            where: { id },
            data: {
                ...dto,
                ...(dto.dueDate && { dueDate: (0, date_util_1.parseLocalDate)(dto.dueDate) }),
            },
            ...expenseInclude,
        });
        return this.serialize(updated);
    }
    async updateStatus(companyId, id, dto) {
        const expense = await this.prisma.expense.findFirst({ where: { id, companyId, deletedAt: null } });
        if (!expense) {
            throw new common_1.NotFoundException('Expense not found');
        }
        if (dto.status === 'PENDING' && Number(expense.paidAmount) > 0) {
            throw new common_1.ConflictException('Esta despesa possui pagamentos registrados. Remova os pagamentos antes de reverter para pendente.');
        }
        const updated = await this.prisma.expense.update({ where: { id }, data: { status: dto.status }, ...expenseInclude });
        return this.serialize(updated);
    }
    async remove(companyId, id) {
        await this.assertExpenseExists(companyId, id);
        await this.prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async addPayment(companyId, expenseId, dto) {
        const expense = await this.prisma.expense.findFirst({ where: { id: expenseId, companyId, deletedAt: null } });
        if (!expense) {
            throw new common_1.NotFoundException('Expense not found');
        }
        if (expense.status === client_1.FinancialStatus.CANCELLED) {
            throw new common_1.ConflictException('Não é possível registrar pagamento em uma despesa cancelada.');
        }
        if (dto.accountId) {
            await this.assertAccountBelongsToCompany(companyId, dto.accountId);
        }
        const totalCents = toCents(Number(expense.amount));
        const currentPaidCents = toCents(Number(expense.paidAmount));
        const newPaidCents = currentPaidCents + toCents(dto.amount);
        if (newPaidCents > totalCents) {
            throw new common_1.BadRequestException('O valor do pagamento excede o saldo restante da despesa.');
        }
        const paidAt = dto.paidAt ? (0, date_util_1.parseLocalDate)(dto.paidAt) : new Date();
        const newStatus = newPaidCents >= totalCents ? client_1.FinancialStatus.PAID : client_1.FinancialStatus.PARTIALLY_PAID;
        await this.prisma.$transaction([
            this.prisma.payment.create({
                data: {
                    companyId,
                    expenseId,
                    accountId: dto.accountId,
                    amount: dto.amount,
                    paymentMethod: dto.paymentMethod,
                    paidAt,
                    notes: dto.notes,
                },
            }),
            this.prisma.expense.update({
                where: { id: expenseId },
                data: {
                    paidAmount: { increment: dto.amount },
                    status: newStatus,
                    ...(newStatus === client_1.FinancialStatus.PAID && { paidAt }),
                },
            }),
        ]);
        return this.findOne(companyId, expenseId);
    }
    async listPayments(companyId, expenseId) {
        await this.assertExpenseExists(companyId, expenseId);
        const payments = await this.prisma.payment.findMany({
            where: { expenseId, companyId },
            orderBy: { paidAt: 'desc' },
            include: { account: { select: { id: true, name: true } } },
        });
        return payments.map((payment) => ({ ...payment, amount: Number(payment.amount) }));
    }
    async removePayment(companyId, expenseId, paymentId) {
        const expense = await this.prisma.expense.findFirst({ where: { id: expenseId, companyId, deletedAt: null } });
        if (!expense) {
            throw new common_1.NotFoundException('Expense not found');
        }
        const payment = await this.prisma.payment.findFirst({ where: { id: paymentId, expenseId, companyId } });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        const totalCents = toCents(Number(expense.amount));
        const currentPaidCents = toCents(Number(expense.paidAmount));
        const newPaidCents = Math.max(0, currentPaidCents - toCents(Number(payment.amount)));
        const newStatus = expense.status === client_1.FinancialStatus.CANCELLED
            ? client_1.FinancialStatus.CANCELLED
            : newPaidCents >= totalCents
                ? client_1.FinancialStatus.PAID
                : newPaidCents > 0
                    ? client_1.FinancialStatus.PARTIALLY_PAID
                    : client_1.FinancialStatus.PENDING;
        await this.prisma.$transaction([
            this.prisma.payment.delete({ where: { id: paymentId } }),
            this.prisma.expense.update({
                where: { id: expenseId },
                data: {
                    paidAmount: { decrement: payment.amount },
                    status: newStatus,
                    ...(newStatus !== client_1.FinancialStatus.PAID && { paidAt: null }),
                },
            }),
        ]);
    }
    async createInstallments(companyId, dto) {
        const count = dto.installments;
        const totalCents = toCents(dto.amount);
        const baseCents = Math.floor(totalCents / count);
        const remainderCents = totalCents - baseCents * count;
        const startDate = (0, date_util_1.parseLocalDate)(dto.dueDate);
        const installmentGroupId = (0, node_crypto_1.randomUUID)();
        const created = await this.prisma.$transaction(Array.from({ length: count }, (_, index) => {
            const cents = baseCents + (index === count - 1 ? remainderCents : 0);
            return this.prisma.expense.create({
                data: {
                    companyId,
                    description: dto.description,
                    amount: cents / 100,
                    dueDate: (0, date_util_1.addMonthsClamped)(startDate, index),
                    paymentMethod: dto.paymentMethod,
                    categoryId: dto.categoryId,
                    accountId: dto.accountId,
                    installmentGroupId,
                    installmentNumber: index + 1,
                    installmentTotal: count,
                },
                ...expenseInclude,
            });
        }));
        return created.map((expense) => this.serialize(expense));
    }
    buildStatusWhere(status) {
        if (!status)
            return {};
        const today = (0, date_util_1.startOfToday)();
        if (status === client_1.FinancialStatus.OVERDUE) {
            return { status: client_1.FinancialStatus.PENDING, dueDate: { lt: today } };
        }
        if (status === client_1.FinancialStatus.PENDING) {
            return { status: client_1.FinancialStatus.PENDING, dueDate: { gte: today } };
        }
        return { status };
    }
    resolveStatus(expense) {
        if (expense.status === client_1.FinancialStatus.PENDING && expense.dueDate < (0, date_util_1.startOfToday)()) {
            return client_1.FinancialStatus.OVERDUE;
        }
        return expense.status;
    }
    async assertExpenseExists(companyId, id) {
        const exists = await this.prisma.expense.findFirst({ where: { id, companyId, deletedAt: null }, select: { id: true } });
        if (!exists) {
            throw new common_1.NotFoundException('Expense not found');
        }
    }
    async assertCategoryBelongsToCompany(companyId, categoryId) {
        const category = await this.prisma.category.findFirst({ where: { id: categoryId, companyId, deletedAt: null } });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
    }
    async assertAccountBelongsToCompany(companyId, accountId) {
        const account = await this.prisma.account.findFirst({ where: { id: accountId, companyId, deletedAt: null } });
        if (!account) {
            throw new common_1.NotFoundException('Account not found');
        }
    }
    serialize(expense) {
        return {
            ...expense,
            amount: Number(expense.amount),
            paidAmount: Number(expense.paidAmount),
            status: this.resolveStatus(expense),
        };
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExpensesService);
//# sourceMappingURL=expenses.service.js.map