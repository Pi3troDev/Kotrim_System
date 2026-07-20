import { Injectable } from '@nestjs/common';
import { Prisma, StockMovementType, WorkOrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { addDays, parseLocalDate, startOfToday } from '../../common/utils/date.util';
import { ReportDateRangeQueryDto } from './dto/report-date-range-query.dto';

const STATUS_ORDER: WorkOrderStatus[] = [
  WorkOrderStatus.OPEN,
  WorkOrderStatus.IN_DIAGNOSIS,
  WorkOrderStatus.WAITING_APPROVAL,
  WorkOrderStatus.IN_PROGRESS,
  WorkOrderStatus.WAITING_PARTS,
  WorkOrderStatus.COMPLETED,
  WorkOrderStatus.DELIVERED,
  WorkOrderStatus.CANCELLED,
];

const COMPLETED_STATUSES: WorkOrderStatus[] = [WorkOrderStatus.COMPLETED, WorkOrderStatus.DELIVERED];

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Caps the number of monthly buckets a single report can generate, so a user picking an
// unreasonably wide date range can't trigger hundreds of aggregate queries in one request.
const MAX_MONTHLY_BUCKETS = 24;

interface MonthRange {
  start: Date;
  end: Date;
  key: string;
  label: string;
}

interface ResolvedRange {
  from: Date;
  toExclusive: Date;
}

export interface FinanceReport {
  totals: { income: number; expense: number; balance: number };
  monthlySeries: { month: string; label: string; revenue: number; expenses: number }[];
  expensesByCategory: { categoryId: string | null; categoryName: string; total: number; percent: number }[];
  incomesByCategory: { categoryId: string | null; categoryName: string; total: number; percent: number }[];
}

export interface WorkOrdersReport {
  totals: { completedCount: number; revenue: number; averageTicket: number };
  statusBreakdown: { status: string; count: number }[];
  mechanicRanking: { employeeId: string; employeeName: string; completedCount: number; revenue: number }[];
}

export interface InventoryReport {
  totals: { stockValue: number; lowStockCount: number; activeItemsCount: number };
  lowStockItems: { id: string; name: string; quantityInStock: number; minimumStock: number }[];
  mostMovedItems: { inventoryItemId: string; name: string; totalIn: number; totalOut: number }[];
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFinanceReport(companyId: string, query: ReportDateRangeQueryDto): Promise<FinanceReport> {
    const range = this.resolveRange(query);
    const months = this.buildMonthRange(range.from, range.toExclusive);

    const [income, expense, monthlySeries, expenseGroups, incomeGroups, categories] = await Promise.all([
      this.sumIncome(companyId, range),
      this.sumExpense(companyId, range),
      Promise.all(
        months.map(async (month) => ({
          month: month.key,
          label: month.label,
          revenue: await this.sumIncome(companyId, { from: month.start, toExclusive: month.end }),
          expenses: await this.sumExpense(companyId, { from: month.start, toExclusive: month.end }),
        })),
      ),
      this.prisma.expense.groupBy({
        by: ['categoryId'],
        where: { companyId, deletedAt: null, status: 'PAID', paidAt: { gte: range.from, lt: range.toExclusive } },
        _sum: { amount: true },
      }),
      this.prisma.income.groupBy({
        by: ['categoryId'],
        where: { companyId, deletedAt: null, status: 'PAID', receivedAt: { gte: range.from, lt: range.toExclusive } },
        _sum: { amount: true },
      }),
      this.prisma.category.findMany({ where: { companyId }, select: { id: true, name: true } }),
    ]);

    const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

    return {
      totals: { income, expense, balance: income - expense },
      monthlySeries,
      expensesByCategory: this.toCategoryBreakdown(expenseGroups, categoryNameById),
      incomesByCategory: this.toCategoryBreakdown(incomeGroups, categoryNameById),
    };
  }

  async getWorkOrdersReport(companyId: string, query: ReportDateRangeQueryDto): Promise<WorkOrdersReport> {
    const range = this.resolveRange(query);

    const [completedAggregate, statusGroups, mechanicGroups, employees] = await Promise.all([
      this.prisma.workOrder.aggregate({
        where: {
          companyId,
          deletedAt: null,
          status: { in: COMPLETED_STATUSES },
          completedAt: { gte: range.from, lt: range.toExclusive },
        },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.workOrder.groupBy({
        by: ['status'],
        where: { companyId, deletedAt: null, openedAt: { gte: range.from, lt: range.toExclusive } },
        _count: { _all: true },
      }),
      this.prisma.workOrder.groupBy({
        by: ['employeeId'],
        where: {
          companyId,
          deletedAt: null,
          employeeId: { not: null },
          status: { in: COMPLETED_STATUSES },
          completedAt: { gte: range.from, lt: range.toExclusive },
        },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.employee.findMany({ where: { companyId }, select: { id: true, name: true } }),
    ]);

    const employeeNameById = new Map(employees.map((e) => [e.id, e.name]));
    const completedCount = completedAggregate._count._all;
    const revenue = Number(completedAggregate._sum.totalAmount ?? 0);

    const statusCountByStatus = new Map(statusGroups.map((g) => [g.status, g._count._all]));
    const statusBreakdown = STATUS_ORDER.map((status) => ({ status, count: statusCountByStatus.get(status) ?? 0 }));

    const mechanicRanking = mechanicGroups
      .filter((g) => g.employeeId !== null)
      .map((g) => ({
        employeeId: g.employeeId!,
        employeeName: employeeNameById.get(g.employeeId!) ?? 'Desconhecido',
        completedCount: g._count._all,
        revenue: Number(g._sum.totalAmount ?? 0),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    return {
      totals: { completedCount, revenue, averageTicket: completedCount > 0 ? revenue / completedCount : 0 },
      statusBreakdown,
      mechanicRanking,
    };
  }

  async getInventoryReport(companyId: string, query: ReportDateRangeQueryDto): Promise<InventoryReport> {
    const range = this.resolveRange(query);

    const [stockValueResult, lowStockItems, activeItemsCount, movementGroups, inventoryItems] = await Promise.all([
      this.prisma.$queryRaw<{ value: Prisma.Decimal | null }[]>(Prisma.sql`
        SELECT SUM("quantityInStock" * "costPrice") as value
        FROM "InventoryItem"
        WHERE "companyId" = ${companyId}::uuid AND "deletedAt" IS NULL
      `),
      this.prisma.$queryRaw<
        { id: string; name: string; quantityInStock: Prisma.Decimal; minimumStock: Prisma.Decimal }[]
      >(Prisma.sql`
        SELECT "id", "name", "quantityInStock", "minimumStock"
        FROM "InventoryItem"
        WHERE "companyId" = ${companyId}::uuid
          AND "deletedAt" IS NULL
          AND "quantityInStock" <= "minimumStock"
        ORDER BY ("minimumStock" - "quantityInStock") DESC
        LIMIT 20
      `),
      this.prisma.inventoryItem.count({ where: { companyId, deletedAt: null } }),
      this.prisma.stockMovement.groupBy({
        by: ['inventoryItemId', 'type'],
        where: { companyId, createdAt: { gte: range.from, lt: range.toExclusive } },
        _sum: { quantity: true },
      }),
      this.prisma.inventoryItem.findMany({ where: { companyId }, select: { id: true, name: true } }),
    ]);

    const itemNameById = new Map(inventoryItems.map((i) => [i.id, i.name]));
    const movementByItem = new Map<string, { totalIn: number; totalOut: number }>();
    for (const group of movementGroups) {
      const entry = movementByItem.get(group.inventoryItemId) ?? { totalIn: 0, totalOut: 0 };
      const quantity = Number(group._sum.quantity ?? 0);
      if (group.type === StockMovementType.IN) {
        entry.totalIn += quantity;
      } else if (group.type === StockMovementType.OUT) {
        entry.totalOut += quantity;
      }
      movementByItem.set(group.inventoryItemId, entry);
    }

    const mostMovedItems = Array.from(movementByItem.entries())
      .map(([inventoryItemId, totals]) => ({
        inventoryItemId,
        name: itemNameById.get(inventoryItemId) ?? 'Desconhecido',
        totalIn: totals.totalIn,
        totalOut: totals.totalOut,
      }))
      .sort((a, b) => b.totalIn + b.totalOut - (a.totalIn + a.totalOut))
      .slice(0, 10);

    return {
      totals: {
        stockValue: Number(stockValueResult[0]?.value ?? 0),
        lowStockCount: lowStockItems.length,
        activeItemsCount,
      },
      lowStockItems: lowStockItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantityInStock: Number(item.quantityInStock),
        minimumStock: Number(item.minimumStock),
      })),
      mostMovedItems,
    };
  }

  private async sumIncome(companyId: string, range: { from: Date; toExclusive: Date }): Promise<number> {
    const result = await this.prisma.income.aggregate({
      _sum: { amount: true },
      where: { companyId, deletedAt: null, status: 'PAID', receivedAt: { gte: range.from, lt: range.toExclusive } },
    });
    return Number(result._sum.amount ?? 0);
  }

  private async sumExpense(companyId: string, range: { from: Date; toExclusive: Date }): Promise<number> {
    const result = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: { companyId, deletedAt: null, status: 'PAID', paidAt: { gte: range.from, lt: range.toExclusive } },
    });
    return Number(result._sum.amount ?? 0);
  }

  private toCategoryBreakdown(
    groups: { categoryId: string | null; _sum: { amount: Prisma.Decimal | null } }[],
    categoryNameById: Map<string, string>,
  ): { categoryId: string | null; categoryName: string; total: number; percent: number }[] {
    const rows = groups.map((g) => ({
      categoryId: g.categoryId,
      categoryName: g.categoryId ? (categoryNameById.get(g.categoryId) ?? 'Categoria removida') : 'Sem categoria',
      total: Number(g._sum.amount ?? 0),
    }));
    const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

    return rows
      .map((r) => ({ ...r, percent: grandTotal > 0 ? (r.total / grandTotal) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);
  }

  private resolveRange(query: ReportDateRangeQueryDto): ResolvedRange {
    const today = startOfToday();
    const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
    const from = query.from ? parseLocalDate(query.from) : defaultFrom;
    const to = query.to ? parseLocalDate(query.to) : today;
    return { from, toExclusive: addDays(to, 1) };
  }

  private buildMonthRange(from: Date, toExclusive: Date): MonthRange[] {
    const months: MonthRange[] = [];
    let cursor = new Date(from.getFullYear(), from.getMonth(), 1);

    while (cursor < toExclusive) {
      const start = cursor;
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
      const label = `${MONTH_LABELS[start.getMonth()]}/${String(start.getFullYear()).slice(2)}`;
      months.push({ start, end, key, label });
      cursor = end;
    }

    return months.length > MAX_MONTHLY_BUCKETS ? months.slice(months.length - MAX_MONTHLY_BUCKETS) : months;
  }
}
