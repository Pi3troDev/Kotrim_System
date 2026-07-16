import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Account } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateAccountDto) {
    await this.assertNameIsUnique(companyId, dto.name);

    const account = await this.prisma.account.create({
      data: { companyId, name: dto.name, type: dto.type, initialBalance: dto.initialBalance ?? 0 },
    });

    return this.serialize(account, 0);
  }

  async findAll(companyId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    if (accounts.length === 0) {
      return [];
    }

    const netByAccount = await this.netPaymentsByAccount(
      companyId,
      accounts.map((account) => account.id),
    );

    return accounts.map((account) => this.serialize(account, netByAccount.get(account.id) ?? 0));
  }

  async findOne(companyId: string, id: string) {
    const account = await this.prisma.account.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const netByAccount = await this.netPaymentsByAccount(companyId, [id]);
    return this.serialize(account, netByAccount.get(id) ?? 0);
  }

  async update(companyId: string, id: string, dto: UpdateAccountDto) {
    await this.assertAccountExists(companyId, id);

    if (dto.name) {
      await this.assertNameIsUnique(companyId, dto.name, id);
    }

    const updated = await this.prisma.account.update({ where: { id }, data: dto });
    const netByAccount = await this.netPaymentsByAccount(companyId, [id]);
    return this.serialize(updated, netByAccount.get(id) ?? 0);
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.assertAccountExists(companyId, id);
    await this.prisma.account.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  /** Net of all Payments booked against each account: incoming (Income payments) minus outgoing (Expense payments). */
  private async netPaymentsByAccount(companyId: string, accountIds: string[]): Promise<Map<string, number>> {
    const [incoming, outgoing] = await Promise.all([
      this.prisma.payment.groupBy({
        by: ['accountId'],
        where: { companyId, accountId: { in: accountIds }, incomeId: { not: null } },
        _sum: { amount: true },
      }),
      this.prisma.payment.groupBy({
        by: ['accountId'],
        where: { companyId, accountId: { in: accountIds }, expenseId: { not: null } },
        _sum: { amount: true },
      }),
    ]);

    const net = new Map<string, number>();
    for (const row of incoming) {
      if (row.accountId) net.set(row.accountId, (net.get(row.accountId) ?? 0) + Number(row._sum.amount ?? 0));
    }
    for (const row of outgoing) {
      if (row.accountId) net.set(row.accountId, (net.get(row.accountId) ?? 0) - Number(row._sum.amount ?? 0));
    }

    return net;
  }

  private async assertAccountExists(companyId: string, id: string): Promise<void> {
    const exists = await this.prisma.account.findFirst({ where: { id, companyId, deletedAt: null }, select: { id: true } });
    if (!exists) {
      throw new NotFoundException('Account not found');
    }
  }

  private async assertNameIsUnique(companyId: string, name: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.account.findFirst({
      where: { companyId, name, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
    });

    if (existing) {
      throw new ConflictException('An account with this name already exists');
    }
  }

  private serialize(account: Account, netPayments: number) {
    return {
      ...account,
      initialBalance: Number(account.initialBalance),
      currentBalance: Number(account.initialBalance) + netPayments,
    };
  }
}
