import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { FinancialStatus, Income, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { addMonthsClamped, parseLocalDate, startOfToday } from '../../common/utils/date.util';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { UpdateIncomeStatusDto } from './dto/update-income-status.dto';
import { QueryIncomesDto } from './dto/query-incomes.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

const incomeInclude = Prisma.validator<Prisma.IncomeDefaultArgs>()({
  include: {
    category: { select: { id: true, name: true } },
    client: { select: { id: true, name: true } },
    workOrder: { select: { id: true, number: true } },
    account: { select: { id: true, name: true, type: true } },
  },
});
type IncomeWithRelations = Prisma.IncomeGetPayload<typeof incomeInclude>;

export interface IncomesSummary {
  pendingTotal: number;
  overdueTotal: number;
  overdueCount: number;
  receivedThisMonthTotal: number;
}

function toCents(value: number): number {
  return Math.round(value * 100);
}

@Injectable()
export class IncomesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateIncomeDto) {
    if (dto.installments && dto.recurrenceFrequency) {
      throw new BadRequestException('Não é possível parcelar e tornar recorrente ao mesmo tempo.');
    }
    if (dto.categoryId) {
      await this.assertCategoryBelongsToCompany(companyId, dto.categoryId);
    }
    if (dto.clientId) {
      await this.assertClientBelongsToCompany(companyId, dto.clientId);
    }
    if (dto.workOrderId) {
      await this.assertWorkOrderBelongsToCompany(companyId, dto.workOrderId);
    }
    if (dto.accountId) {
      await this.assertAccountBelongsToCompany(companyId, dto.accountId);
    }

    if (dto.installments && dto.installments > 1) {
      return this.createInstallments(companyId, dto);
    }

    const created = await this.prisma.income.create({
      data: {
        companyId,
        description: dto.description,
        amount: dto.amount,
        dueDate: parseLocalDate(dto.dueDate),
        paymentMethod: dto.paymentMethod,
        categoryId: dto.categoryId,
        clientId: dto.clientId,
        workOrderId: dto.workOrderId,
        accountId: dto.accountId,
        recurrenceFrequency: dto.recurrenceFrequency,
        recurringGroupId: dto.recurrenceFrequency ? randomUUID() : undefined,
        recurrenceEndDate: dto.recurrenceEndDate ? parseLocalDate(dto.recurrenceEndDate) : undefined,
      },
      ...incomeInclude,
    });

    return [this.serialize(created)];
  }

  /** Stops future occurrences of a recurring series — the cron only ever looks at rows with recurrenceFrequency still set. */
  async stopRecurrence(companyId: string, id: string): Promise<void> {
    const income = await this.prisma.income.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!income) {
      throw new NotFoundException('Income not found');
    }
    if (!income.recurringGroupId) {
      throw new BadRequestException('Esta receita não faz parte de uma série recorrente.');
    }

    await this.prisma.income.updateMany({
      where: { recurringGroupId: income.recurringGroupId, companyId, deletedAt: null },
      data: { recurrenceFrequency: null, recurrenceEndDate: null },
    });
  }

  async findAll(companyId: string, query: QueryIncomesDto): Promise<PaginatedResult<ReturnType<typeof this.serialize>>> {
    const { page, limit, search, status, categoryId, clientId } = query;

    const where: Prisma.IncomeWhereInput = {
      companyId,
      deletedAt: null,
      ...(categoryId && { categoryId }),
      ...(clientId && { clientId }),
      ...this.buildStatusWhere(status),
      ...(search && { description: { contains: search, mode: 'insensitive' } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.income.findMany({
        where,
        orderBy: { dueDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        ...incomeInclude,
      }),
      this.prisma.income.count({ where }),
    ]);

    return paginate(data.map((income) => this.serialize(income)), total, page, limit);
  }

  async summary(companyId: string): Promise<IncomesSummary> {
    const now = new Date();
    const today = startOfToday();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [pending, overdue, overdueCount, receivedThisMonth] = await Promise.all([
      this.prisma.income.aggregate({
        where: { companyId, deletedAt: null, status: FinancialStatus.PENDING, dueDate: { gte: today } },
        _sum: { amount: true },
      }),
      this.prisma.income.aggregate({
        where: { companyId, deletedAt: null, status: FinancialStatus.PENDING, dueDate: { lt: today } },
        _sum: { amount: true },
      }),
      this.prisma.income.count({
        where: { companyId, deletedAt: null, status: FinancialStatus.PENDING, dueDate: { lt: today } },
      }),
      this.prisma.income.aggregate({
        where: { companyId, deletedAt: null, status: FinancialStatus.PAID, receivedAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
    ]);

    return {
      pendingTotal: Number(pending._sum.amount ?? 0),
      overdueTotal: Number(overdue._sum.amount ?? 0),
      overdueCount,
      receivedThisMonthTotal: Number(receivedThisMonth._sum.amount ?? 0),
    };
  }

  async findOne(companyId: string, id: string) {
    const income = await this.prisma.income.findFirst({ where: { id, companyId, deletedAt: null }, ...incomeInclude });
    if (!income) {
      throw new NotFoundException('Income not found');
    }
    return this.serialize(income);
  }

  async update(companyId: string, id: string, dto: UpdateIncomeDto) {
    await this.assertIncomeExists(companyId, id);

    if (dto.categoryId) {
      await this.assertCategoryBelongsToCompany(companyId, dto.categoryId);
    }
    if (dto.clientId) {
      await this.assertClientBelongsToCompany(companyId, dto.clientId);
    }
    if (dto.workOrderId) {
      await this.assertWorkOrderBelongsToCompany(companyId, dto.workOrderId);
    }
    if (dto.accountId) {
      await this.assertAccountBelongsToCompany(companyId, dto.accountId);
    }

    const updated = await this.prisma.income.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.dueDate && { dueDate: parseLocalDate(dto.dueDate) }),
      },
      ...incomeInclude,
    });

    return this.serialize(updated);
  }

  async updateStatus(companyId: string, id: string, dto: UpdateIncomeStatusDto) {
    const income = await this.prisma.income.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!income) {
      throw new NotFoundException('Income not found');
    }

    if (dto.status === 'PENDING' && Number(income.paidAmount) > 0) {
      throw new ConflictException(
        'Esta receita possui pagamentos registrados. Remova os pagamentos antes de reverter para pendente.',
      );
    }

    const updated = await this.prisma.income.update({ where: { id }, data: { status: dto.status }, ...incomeInclude });
    return this.serialize(updated);
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.assertIncomeExists(companyId, id);
    await this.prisma.income.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async addPayment(companyId: string, incomeId: string, dto: CreatePaymentDto) {
    const income = await this.prisma.income.findFirst({ where: { id: incomeId, companyId, deletedAt: null } });
    if (!income) {
      throw new NotFoundException('Income not found');
    }
    if (income.status === FinancialStatus.CANCELLED) {
      throw new ConflictException('Não é possível registrar pagamento em uma receita cancelada.');
    }
    if (dto.accountId) {
      await this.assertAccountBelongsToCompany(companyId, dto.accountId);
    }

    const totalCents = toCents(Number(income.amount));
    const currentPaidCents = toCents(Number(income.paidAmount));
    const newPaidCents = currentPaidCents + toCents(dto.amount);

    if (newPaidCents > totalCents) {
      throw new BadRequestException('O valor do pagamento excede o saldo restante da receita.');
    }

    const paidAt = dto.paidAt ? parseLocalDate(dto.paidAt) : new Date();
    const newStatus = newPaidCents >= totalCents ? FinancialStatus.PAID : FinancialStatus.PARTIALLY_PAID;

    await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          companyId,
          incomeId,
          accountId: dto.accountId,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          paidAt,
          notes: dto.notes,
        },
      }),
      this.prisma.income.update({
        where: { id: incomeId },
        data: {
          paidAmount: { increment: dto.amount },
          status: newStatus,
          ...(newStatus === FinancialStatus.PAID && { receivedAt: paidAt }),
        },
      }),
    ]);

    return this.findOne(companyId, incomeId);
  }

  async listPayments(companyId: string, incomeId: string) {
    await this.assertIncomeExists(companyId, incomeId);

    const payments = await this.prisma.payment.findMany({
      where: { incomeId, companyId },
      orderBy: { paidAt: 'desc' },
      include: { account: { select: { id: true, name: true } } },
    });

    return payments.map((payment) => ({ ...payment, amount: Number(payment.amount) }));
  }

  async removePayment(companyId: string, incomeId: string, paymentId: string): Promise<void> {
    const income = await this.prisma.income.findFirst({ where: { id: incomeId, companyId, deletedAt: null } });
    if (!income) {
      throw new NotFoundException('Income not found');
    }

    const payment = await this.prisma.payment.findFirst({ where: { id: paymentId, incomeId, companyId } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const totalCents = toCents(Number(income.amount));
    const currentPaidCents = toCents(Number(income.paidAmount));
    const newPaidCents = Math.max(0, currentPaidCents - toCents(Number(payment.amount)));

    const newStatus =
      income.status === FinancialStatus.CANCELLED
        ? FinancialStatus.CANCELLED
        : newPaidCents >= totalCents
          ? FinancialStatus.PAID
          : newPaidCents > 0
            ? FinancialStatus.PARTIALLY_PAID
            : FinancialStatus.PENDING;

    await this.prisma.$transaction([
      this.prisma.payment.delete({ where: { id: paymentId } }),
      this.prisma.income.update({
        where: { id: incomeId },
        data: {
          paidAmount: { decrement: payment.amount },
          status: newStatus,
          ...(newStatus !== FinancialStatus.PAID && { receivedAt: null }),
        },
      }),
    ]);
  }

  private async createInstallments(companyId: string, dto: CreateIncomeDto) {
    const count = dto.installments!;
    const totalCents = toCents(dto.amount);
    const baseCents = Math.floor(totalCents / count);
    const remainderCents = totalCents - baseCents * count;
    const startDate = parseLocalDate(dto.dueDate);
    const installmentGroupId = randomUUID();

    const created = await this.prisma.$transaction(
      Array.from({ length: count }, (_, index) => {
        const cents = baseCents + (index === count - 1 ? remainderCents : 0);
        return this.prisma.income.create({
          data: {
            companyId,
            description: dto.description,
            amount: cents / 100,
            dueDate: addMonthsClamped(startDate, index),
            paymentMethod: dto.paymentMethod,
            categoryId: dto.categoryId,
            clientId: dto.clientId,
            workOrderId: dto.workOrderId,
            accountId: dto.accountId,
            installmentGroupId,
            installmentNumber: index + 1,
            installmentTotal: count,
          },
          ...incomeInclude,
        });
      }),
    );

    return created.map((income) => this.serialize(income));
  }

  private buildStatusWhere(status?: FinancialStatus): Prisma.IncomeWhereInput {
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

  private resolveStatus(income: { status: FinancialStatus; dueDate: Date }): FinancialStatus {
    if (income.status === FinancialStatus.PENDING && income.dueDate < startOfToday()) {
      return FinancialStatus.OVERDUE;
    }
    return income.status;
  }

  private async assertIncomeExists(companyId: string, id: string): Promise<void> {
    const exists = await this.prisma.income.findFirst({ where: { id, companyId, deletedAt: null }, select: { id: true } });
    if (!exists) {
      throw new NotFoundException('Income not found');
    }
  }

  private async assertCategoryBelongsToCompany(companyId: string, categoryId: string): Promise<void> {
    const category = await this.prisma.category.findFirst({ where: { id: categoryId, companyId, deletedAt: null } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }

  private async assertClientBelongsToCompany(companyId: string, clientId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({ where: { id: clientId, companyId, deletedAt: null } });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
  }

  private async assertWorkOrderBelongsToCompany(companyId: string, workOrderId: string): Promise<void> {
    const workOrder = await this.prisma.workOrder.findFirst({ where: { id: workOrderId, companyId, deletedAt: null } });
    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }
  }

  private async assertAccountBelongsToCompany(companyId: string, accountId: string): Promise<void> {
    const account = await this.prisma.account.findFirst({ where: { id: accountId, companyId, deletedAt: null } });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
  }

  private serialize(income: IncomeWithRelations): Omit<Income, 'amount' | 'paidAmount' | 'status'> & {
    amount: number;
    paidAmount: number;
    status: FinancialStatus;
    category: { id: string; name: string } | null;
    client: { id: string; name: string } | null;
    workOrder: { id: string; number: number } | null;
    account: { id: string; name: string; type: string } | null;
  } {
    return {
      ...income,
      amount: Number(income.amount),
      paidAmount: Number(income.paidAmount),
      status: this.resolveStatus(income),
    };
  }
}
