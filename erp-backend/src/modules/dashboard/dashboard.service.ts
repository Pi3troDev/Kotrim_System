import { Injectable } from '@nestjs/common';
import { AppointmentStatus, Prisma, WorkOrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
// This file has its own local addDays() further down; only startOfToday is borrowed.
import { startOfToday } from '../../common/utils/date.util';
import { PlanFeature } from '../billing/plan-features';
import {
  DashboardKpi,
  DashboardMonthPoint,
  DashboardStatusCount,
  DashboardSummary,
} from './interfaces/dashboard-summary.interface';

const OPEN_STATUSES: WorkOrderStatus[] = [
  WorkOrderStatus.OPEN,
  WorkOrderStatus.IN_DIAGNOSIS,
  WorkOrderStatus.WAITING_APPROVAL,
  WorkOrderStatus.IN_PROGRESS,
  WorkOrderStatus.WAITING_PARTS,
];

const COMPLETED_STATUSES: WorkOrderStatus[] = [WorkOrderStatus.COMPLETED, WorkOrderStatus.DELIVERED];

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

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

interface MonthRange {
  start: Date;
  end: Date;
  key: string;
  label: string;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(companyId: string, features: PlanFeature[]): Promise<DashboardSummary> {
    const currentMonth = monthRange(0);
    const previousMonth = monthRange(-1);
    const warrantyWindowEnd = addDays(new Date(), 30);
    const todayStart = startOfToday();
    const todayEnd = addDays(todayStart, 1);

    const [
      openWorkOrdersCount,
      completedThisMonth,
      completedLastMonth,
      todayAppointmentsCount,
      vehiclesInShopGroups,
      statusGroups,
      upcomingWarranties,
      recentWorkOrders,
    ] = await Promise.all([
      this.prisma.workOrder.count({
        where: { companyId, deletedAt: null, status: { in: OPEN_STATUSES } },
      }),
      this.prisma.workOrder.count({
        where: {
          companyId,
          deletedAt: null,
          status: { in: COMPLETED_STATUSES },
          completedAt: { gte: currentMonth.start, lt: currentMonth.end },
        },
      }),
      this.prisma.workOrder.count({
        where: {
          companyId,
          deletedAt: null,
          status: { in: COMPLETED_STATUSES },
          completedAt: { gte: previousMonth.start, lt: previousMonth.end },
        },
      }),
      this.prisma.appointment.count({
        where: {
          companyId,
          deletedAt: null,
          status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
          scheduledStart: { gte: todayStart, lt: todayEnd },
        },
      }),
      // Distinct vehicles currently on an open work order — one car with three
      // open orders is still one car in the shop.
      this.prisma.workOrder.groupBy({
        by: ['vehicleId'],
        where: { companyId, deletedAt: null, status: { in: OPEN_STATUSES } },
      }),
      this.prisma.workOrder.groupBy({
        by: ['status'],
        where: { companyId, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.workOrder.findMany({
        where: {
          companyId,
          deletedAt: null,
          warrantyUntil: { gte: new Date(), lte: warrantyWindowEnd },
        },
        orderBy: { warrantyUntil: 'asc' },
        take: 6,
        include: {
          client: { select: { name: true } },
          vehicle: { select: { plate: true, brand: true, model: true } },
        },
      }),
      this.prisma.workOrder.findMany({
        where: { companyId, deletedAt: null },
        orderBy: { openedAt: 'desc' },
        take: 6,
        include: {
          client: { select: { name: true } },
          vehicle: { select: { plate: true, brand: true, model: true } },
        },
      }),
    ]);

    const statusCountByStatus = new Map(statusGroups.map((g) => [g.status, g._count._all]));
    const statusBreakdown: DashboardStatusCount[] = STATUS_ORDER.map((status) => ({
      status,
      count: statusCountByStatus.get(status) ?? 0,
    }));

    // Gated sections are queried only when the plan owns them — an Essencial
    // dashboard should not be paying for six months of income aggregation it
    // will never render.
    const financial = features.includes(PlanFeature.FINANCE)
      ? await this.buildFinancialSection(companyId, currentMonth, previousMonth)
      : null;

    const stock = features.includes(PlanFeature.INVENTORY)
      ? await this.buildStockSection(companyId)
      : null;

    return {
      openWorkOrders: { value: openWorkOrdersCount },
      completedWorkOrders: toKpi(completedThisMonth, completedLastMonth),
      todayAppointments: { value: todayAppointmentsCount },
      vehiclesInShop: { value: vehiclesInShopGroups.length },
      statusBreakdown,

      revenue: financial?.revenue ?? null,
      expenses: financial?.expenses ?? null,
      profit: financial?.profit ?? null,
      monthlySeries: financial?.monthlySeries ?? null,

      lowStockItems: stock?.lowStockItems ?? null,
      lowStockCount: stock?.lowStockCount ?? null,

      upcomingWarranties: upcomingWarranties.map((wo) => ({
        id: wo.id,
        workOrderNumber: wo.number,
        clientName: wo.client.name,
        vehicleLabel: `${wo.vehicle.brand} ${wo.vehicle.model} · ${wo.vehicle.plate}`,
        warrantyUntil: wo.warrantyUntil!.toISOString(),
      })),
      recentWorkOrders: recentWorkOrders.map((wo) => ({
        id: wo.id,
        number: wo.number,
        clientName: wo.client.name,
        vehicleLabel: `${wo.vehicle.brand} ${wo.vehicle.model} · ${wo.vehicle.plate}`,
        status: wo.status,
        totalAmount: Number(wo.totalAmount),
        openedAt: wo.openedAt.toISOString(),
      })),
    };
  }

  /** Only called when the plan includes FINANCE. */
  private async buildFinancialSection(companyId: string, currentMonth: MonthRange, previousMonth: MonthRange) {
    const last6Months = Array.from({ length: 6 }, (_, i) => monthRange(-(5 - i)));

    const [revenueThisMonth, revenueLastMonth, expensesThisMonth, expensesLastMonth, monthlySeries] =
      await Promise.all([
        this.sumIncome(companyId, currentMonth),
        this.sumIncome(companyId, previousMonth),
        this.sumExpense(companyId, currentMonth),
        this.sumExpense(companyId, previousMonth),
        Promise.all(
          last6Months.map(async (month) => ({
            month: month.key,
            label: month.label,
            revenue: await this.sumIncome(companyId, month),
            expenses: await this.sumExpense(companyId, month),
          })),
        ),
      ]);

    return {
      revenue: toKpi(revenueThisMonth, revenueLastMonth),
      expenses: toKpi(expensesThisMonth, expensesLastMonth),
      profit: toKpi(revenueThisMonth - expensesThisMonth, revenueLastMonth - expensesLastMonth),
      monthlySeries: monthlySeries as DashboardMonthPoint[],
    };
  }

  /** Only called when the plan includes INVENTORY. */
  private async buildStockSection(companyId: string) {
    const [lowStockItems, lowStockCount] = await Promise.all([
      this.prisma.$queryRaw<
        { id: string; name: string; quantityInStock: Prisma.Decimal; minimumStock: Prisma.Decimal }[]
      >(Prisma.sql`
        SELECT "id", "name", "quantityInStock", "minimumStock"
        FROM "InventoryItem"
        WHERE "companyId" = ${companyId}::uuid
          AND "deletedAt" IS NULL
          AND "quantityInStock" <= "minimumStock"
        ORDER BY ("minimumStock" - "quantityInStock") DESC
        LIMIT 6
      `),
      this.prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
        SELECT COUNT(*) as count
        FROM "InventoryItem"
        WHERE "companyId" = ${companyId}::uuid
          AND "deletedAt" IS NULL
          AND "quantityInStock" <= "minimumStock"
      `),
    ]);

    return {
      lowStockItems: lowStockItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantityInStock: Number(item.quantityInStock),
        minimumStock: Number(item.minimumStock),
      })),
      lowStockCount: Number(lowStockCount[0]?.count ?? 0),
    };
  }

  private async sumIncome(companyId: string, range: MonthRange): Promise<number> {
    const result = await this.prisma.income.aggregate({
      _sum: { amount: true },
      where: {
        companyId,
        deletedAt: null,
        status: 'PAID',
        receivedAt: { gte: range.start, lt: range.end },
      },
    });
    return Number(result._sum.amount ?? 0);
  }

  private async sumExpense(companyId: string, range: MonthRange): Promise<number> {
    const result = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        companyId,
        deletedAt: null,
        status: 'PAID',
        paidAt: { gte: range.start, lt: range.end },
      },
    });
    return Number(result._sum.amount ?? 0);
  }
}

function toKpi(value: number, previousValue: number): DashboardKpi {
  const deltaPercent =
    previousValue === 0 ? (value === 0 ? 0 : 100) : ((value - previousValue) / Math.abs(previousValue)) * 100;
  return { value, previousValue, deltaPercent: Math.round(deltaPercent * 10) / 10 };
}

function monthRange(offsetFromCurrent: number): MonthRange {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetFromCurrent, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetFromCurrent + 1, 1));
  const key = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
  const label = MONTH_LABELS[start.getUTCMonth()];
  return { start, end, key, label };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
