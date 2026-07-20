import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Expense, FinancialStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { addMonthsClamped, parseLocalDate, startOfToday } from '../../common/utils/date.util';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { UpdateExpenseStatusDto } from './dto/update-expense-status.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

const expenseInclude = Prisma.validator<Prisma.ExpenseDefaultArgs>()({
  include: {
    category: { select: { id: true, name: true } },
    account: { select: { id: true, name: true, type: true } },
    employee: { select: { id: true, name: true } },
  },
});
type ExpenseWithRelations = Prisma.ExpenseGetPayload<typeof expenseInclude>;

export interface ExpensesSummary {
  pendingTotal: number;
  overdueTotal: number;
  overdueCount: number;
  paidThisMonthTotal: number;
}

function toCents(value: number): number {
  return Math.round(value * 100);
}

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateExpenseDto) {
    if (dto.installments && dto.recurrenceFrequency) {
      throw new BadRequestException('Não é possível parcelar e tornar recorrente ao mesmo tempo.');
    }
    if (dto.categoryId) {
      await this.assertCategoryBelongsToCompany(companyId, dto.categoryId);
    }
    if (dto.accountId) {
      await this.assertAccountBelongsToCompany(companyId, dto.accountId);
    }
    if (dto.employeeId) {
      await this.assertEmployeeBelongsToCompany(companyId, dto.employeeId);
    }

    if (dto.installments && dto.installments > 1) {
      return this.createInstallments(companyId, dto);
    }

    const created = await this.prisma.expense.create({
      data: {
        companyId,
        description: dto.description,
        amount: dto.amount,
        dueDate: parseLocalDate(dto.dueDate),
        paymentMethod: dto.paymentMethod,
        categoryId: dto.categoryId,
        accountId: dto.accountId,
        employeeId: dto.employeeId,
        recurrenceFrequency: dto.recurrenceFrequency,
        recurringGroupId: dto.recurrenceFrequency ? randomUUID() : undefined,
        recurrenceEndDate: dto.recurrenceEndDate ? parseLocalDate(dto.recurrenceEndDate) : undefined,
      },
      ...expenseInclude,
    });

    return [this.serialize(created)];
  }

  /** Stops future occurrences of a recurring series — the cron only ever looks at rows with recurrenceFrequency still set. */
  async stopRecurrence(companyId: string, id: string): Promise<void> {
    const expense = await this.prisma.expense.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    if (!expense.recurringGroupId) {
      throw new BadRequestException('Esta despesa não faz parte de uma série recorrente.');
    }

    await this.prisma.expense.updateMany({
      where: { recurringGroupId: expense.recurringGroupId, companyId, deletedAt: null },
      data: { recurrenceFrequency: null, recurrenceEndDate: null },
    });
  }

  async findAll(companyId: string, query: QueryExpensesDto): Promise<PaginatedResult<ReturnType<typeof this.serialize>>> {
    const { page, limit, search, status, categoryId } = query;

    const where: Prisma.ExpenseWhereInput = {
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

    return paginate(data.map((expense) => this.serialize(expense)), total, page, limit);
  }

  async summary(companyId: string): Promise<ExpensesSummary> {
    const now = new Date();
    const today = startOfToday();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [pending, overdue, overdueCount, paidThisMonth] = await Promise.all([
      this.prisma.expense.aggregate({
        where: { companyId, deletedAt: null, status: FinancialStatus.PENDING, dueDate: { gte: today } },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { companyId, deletedAt: null, status: FinancialStatus.PENDING, dueDate: { lt: today } },
        _sum: { amount: true },
      }),
      this.prisma.expense.count({
        where: { companyId, deletedAt: null, status: FinancialStatus.PENDING, dueDate: { lt: today } },
      }),
      this.prisma.expense.aggregate({
        where: { companyId, deletedAt: null, status: FinancialStatus.PAID, paidAt: { gte: monthStart } },
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

  async findOne(companyId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({ where: { id, companyId, deletedAt: null }, ...expenseInclude });
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    return this.serialize(expense);
  }

  async update(companyId: string, id: string, dto: UpdateExpenseDto) {
    await this.assertExpenseExists(companyId, id);

    if (dto.categoryId) {
      await this.assertCategoryBelongsToCompany(companyId, dto.categoryId);
    }
    if (dto.accountId) {
      await this.assertAccountBelongsToCompany(companyId, dto.accountId);
    }
    if (dto.employeeId) {
      await this.assertEmployeeBelongsToCompany(companyId, dto.employeeId);
    }

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.dueDate && { dueDate: parseLocalDate(dto.dueDate) }),
      },
      ...expenseInclude,
    });

    return this.serialize(updated);
  }

  async updateStatus(companyId: string, id: string, dto: UpdateExpenseStatusDto) {
    const expense = await this.prisma.expense.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (dto.status === 'PENDING' && Number(expense.paidAmount) > 0) {
      throw new ConflictException(
        'Esta despesa possui pagamentos registrados. Remova os pagamentos antes de reverter para pendente.',
      );
    }

    const updated = await this.prisma.expense.update({ where: { id }, data: { status: dto.status }, ...expenseInclude });
    return this.serialize(updated);
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.assertExpenseExists(companyId, id);
    await this.prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async addPayment(companyId: string, expenseId: string, dto: CreatePaymentDto) {
    const expense = await this.prisma.expense.findFirst({ where: { id: expenseId, companyId, deletedAt: null } });
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    if (expense.status === FinancialStatus.CANCELLED) {
      throw new ConflictException('Não é possível registrar pagamento em uma despesa cancelada.');
    }
    if (dto.accountId) {
      await this.assertAccountBelongsToCompany(companyId, dto.accountId);
    }

    const totalCents = toCents(Number(expense.amount));
    const currentPaidCents = toCents(Number(expense.paidAmount));
    const newPaidCents = currentPaidCents + toCents(dto.amount);

    if (newPaidCents > totalCents) {
      throw new BadRequestException('O valor do pagamento excede o saldo restante da despesa.');
    }

    const paidAt = dto.paidAt ? parseLocalDate(dto.paidAt) : new Date();
    const newStatus = newPaidCents >= totalCents ? FinancialStatus.PAID : FinancialStatus.PARTIALLY_PAID;

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
          ...(newStatus === FinancialStatus.PAID && { paidAt }),
        },
      }),
    ]);

    return this.findOne(companyId, expenseId);
  }

  async listPayments(companyId: string, expenseId: string) {
    await this.assertExpenseExists(companyId, expenseId);

    const payments = await this.prisma.payment.findMany({
      where: { expenseId, companyId },
      orderBy: { paidAt: 'desc' },
      include: { account: { select: { id: true, name: true } } },
    });

    return payments.map((payment) => ({ ...payment, amount: Number(payment.amount) }));
  }

  async removePayment(companyId: string, expenseId: string, paymentId: string): Promise<void> {
    const expense = await this.prisma.expense.findFirst({ where: { id: expenseId, companyId, deletedAt: null } });
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    const payment = await this.prisma.payment.findFirst({ where: { id: paymentId, expenseId, companyId } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const totalCents = toCents(Number(expense.amount));
    const currentPaidCents = toCents(Number(expense.paidAmount));
    const newPaidCents = Math.max(0, currentPaidCents - toCents(Number(payment.amount)));

    const newStatus =
      expense.status === FinancialStatus.CANCELLED
        ? FinancialStatus.CANCELLED
        : newPaidCents >= totalCents
          ? FinancialStatus.PAID
          : newPaidCents > 0
            ? FinancialStatus.PARTIALLY_PAID
            : FinancialStatus.PENDING;

    await this.prisma.$transaction([
      this.prisma.payment.delete({ where: { id: paymentId } }),
      this.prisma.expense.update({
        where: { id: expenseId },
        data: {
          paidAmount: { decrement: payment.amount },
          status: newStatus,
          ...(newStatus !== FinancialStatus.PAID && { paidAt: null }),
        },
      }),
    ]);
  }

  private async createInstallments(companyId: string, dto: CreateExpenseDto) {
    const count = dto.installments!;
    const totalCents = toCents(dto.amount);
    const baseCents = Math.floor(totalCents / count);
    const remainderCents = totalCents - baseCents * count;
    const startDate = parseLocalDate(dto.dueDate);
    const installmentGroupId = randomUUID();

    const created = await this.prisma.$transaction(
      Array.from({ length: count }, (_, index) => {
        const cents = baseCents + (index === count - 1 ? remainderCents : 0);
        return this.prisma.expense.create({
          data: {
            companyId,
            description: dto.description,
            amount: cents / 100,
            dueDate: addMonthsClamped(startDate, index),
            paymentMethod: dto.paymentMethod,
            categoryId: dto.categoryId,
            accountId: dto.accountId,
            employeeId: dto.employeeId,
            installmentGroupId,
            installmentNumber: index + 1,
            installmentTotal: count,
          },
          ...expenseInclude,
        });
      }),
    );

    return created.map((expense) => this.serialize(expense));
  }

  private buildStatusWhere(status?: FinancialStatus): Prisma.ExpenseWhereInput {
    if (!status) return {};
    const today = startOfToday();
    if (status === FinancialStatus.OVERDUE) {
      return { status: FinancialStatus.PENDING, dueDate: { lt: today } };
    }
    if (status === FinancialStatus.PENDING) {
      return { status: FinancialStatus.PENDING, dueDate: { gte: today } };
    }
    return { status };
  }

  private resolveStatus(expense: { status: FinancialStatus; dueDate: Date }): FinancialStatus {
    if (expense.status === FinancialStatus.PENDING && expense.dueDate < startOfToday()) {
      return FinancialStatus.OVERDUE;
    }
    return expense.status;
  }

  private async assertExpenseExists(companyId: string, id: string): Promise<void> {
    const exists = await this.prisma.expense.findFirst({ where: { id, companyId, deletedAt: null }, select: { id: true } });
    if (!exists) {
      throw new NotFoundException('Expense not found');
    }
  }

  private async assertCategoryBelongsToCompany(companyId: string, categoryId: string): Promise<void> {
    const category = await this.prisma.category.findFirst({ where: { id: categoryId, companyId, deletedAt: null } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }

  private async assertAccountBelongsToCompany(companyId: string, accountId: string): Promise<void> {
    const account = await this.prisma.account.findFirst({ where: { id: accountId, companyId, deletedAt: null } });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
  }

  private async assertEmployeeBelongsToCompany(companyId: string, employeeId: string): Promise<void> {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, companyId, deletedAt: null } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
  }

  private serialize(expense: ExpenseWithRelations): Omit<Expense, 'amount' | 'paidAmount' | 'status'> & {
    amount: number;
    paidAmount: number;
    status: FinancialStatus;
    category: { id: string; name: string } | null;
    account: { id: string; name: string; type: string } | null;
    employee: { id: string; name: string } | null;
  } {
    return {
      ...expense,
      amount: Number(expense.amount),
      paidAmount: Number(expense.paidAmount),
      status: this.resolveStatus(expense),
    };
  }
}
