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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const OPEN_STATUSES = [
    client_1.WorkOrderStatus.OPEN,
    client_1.WorkOrderStatus.IN_DIAGNOSIS,
    client_1.WorkOrderStatus.WAITING_APPROVAL,
    client_1.WorkOrderStatus.IN_PROGRESS,
    client_1.WorkOrderStatus.WAITING_PARTS,
];
const COMPLETED_STATUSES = [client_1.WorkOrderStatus.COMPLETED, client_1.WorkOrderStatus.DELIVERED];
const STATUS_ORDER = [
    client_1.WorkOrderStatus.OPEN,
    client_1.WorkOrderStatus.IN_DIAGNOSIS,
    client_1.WorkOrderStatus.WAITING_APPROVAL,
    client_1.WorkOrderStatus.IN_PROGRESS,
    client_1.WorkOrderStatus.WAITING_PARTS,
    client_1.WorkOrderStatus.COMPLETED,
    client_1.WorkOrderStatus.DELIVERED,
    client_1.WorkOrderStatus.CANCELLED,
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
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSummary(companyId) {
        const currentMonth = monthRange(0);
        const previousMonth = monthRange(-1);
        const last6Months = Array.from({ length: 6 }, (_, i) => monthRange(-(5 - i)));
        const warrantyWindowEnd = addDays(new Date(), 30);
        const [openWorkOrdersCount, completedThisMonth, completedLastMonth, revenueThisMonth, revenueLastMonth, expensesThisMonth, expensesLastMonth, statusGroups, monthlySeries, lowStockItems, lowStockCount, upcomingWarranties, recentWorkOrders,] = await Promise.all([
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
            this.sumIncome(companyId, currentMonth),
            this.sumIncome(companyId, previousMonth),
            this.sumExpense(companyId, currentMonth),
            this.sumExpense(companyId, previousMonth),
            this.prisma.workOrder.groupBy({
                by: ['status'],
                where: { companyId, deletedAt: null },
                _count: { _all: true },
            }),
            Promise.all(last6Months.map(async (month) => ({
                month: month.key,
                label: month.label,
                revenue: await this.sumIncome(companyId, month),
                expenses: await this.sumExpense(companyId, month),
            }))),
            this.prisma.$queryRaw(client_1.Prisma.sql `
        SELECT "id", "name", "quantityInStock", "minimumStock"
        FROM "InventoryItem"
        WHERE "companyId" = ${companyId}::uuid
          AND "deletedAt" IS NULL
          AND "quantityInStock" <= "minimumStock"
        ORDER BY ("minimumStock" - "quantityInStock") DESC
        LIMIT 6
      `),
            this.prisma.$queryRaw(client_1.Prisma.sql `
        SELECT COUNT(*) as count
        FROM "InventoryItem"
        WHERE "companyId" = ${companyId}::uuid
          AND "deletedAt" IS NULL
          AND "quantityInStock" <= "minimumStock"
      `),
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
        const statusBreakdown = STATUS_ORDER.map((status) => ({
            status,
            count: statusCountByStatus.get(status) ?? 0,
        }));
        const profitThisMonth = revenueThisMonth - expensesThisMonth;
        const profitLastMonth = revenueLastMonth - expensesLastMonth;
        return {
            openWorkOrders: { value: openWorkOrdersCount },
            completedWorkOrders: toKpi(completedThisMonth, completedLastMonth),
            revenue: toKpi(revenueThisMonth, revenueLastMonth),
            expenses: toKpi(expensesThisMonth, expensesLastMonth),
            profit: toKpi(profitThisMonth, profitLastMonth),
            statusBreakdown,
            monthlySeries: monthlySeries,
            lowStockItems: lowStockItems.map((item) => ({
                id: item.id,
                name: item.name,
                quantityInStock: Number(item.quantityInStock),
                minimumStock: Number(item.minimumStock),
            })),
            lowStockCount: Number(lowStockCount[0]?.count ?? 0),
            upcomingWarranties: upcomingWarranties.map((wo) => ({
                id: wo.id,
                workOrderNumber: wo.number,
                clientName: wo.client.name,
                vehicleLabel: `${wo.vehicle.brand} ${wo.vehicle.model} · ${wo.vehicle.plate}`,
                warrantyUntil: wo.warrantyUntil.toISOString(),
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
    async sumIncome(companyId, range) {
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
    async sumExpense(companyId, range) {
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
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
function toKpi(value, previousValue) {
    const deltaPercent = previousValue === 0 ? (value === 0 ? 0 : 100) : ((value - previousValue) / Math.abs(previousValue)) * 100;
    return { value, previousValue, deltaPercent: Math.round(deltaPercent * 10) / 10 };
}
function monthRange(offsetFromCurrent) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetFromCurrent, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetFromCurrent + 1, 1));
    const key = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
    const label = MONTH_LABELS[start.getUTCMonth()];
    return { start, end, key, label };
}
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
//# sourceMappingURL=dashboard.service.js.map