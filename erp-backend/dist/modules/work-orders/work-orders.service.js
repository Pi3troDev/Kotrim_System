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
exports.WorkOrdersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const paginated_result_interface_1 = require("../../common/interfaces/paginated-result.interface");
const TERMINAL_STATUSES = [client_1.WorkOrderStatus.DELIVERED, client_1.WorkOrderStatus.CANCELLED];
const workOrderInclude = client_1.Prisma.validator()({
    include: {
        client: { select: { id: true, name: true } },
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
        items: { orderBy: { createdAt: 'asc' } },
        history: { orderBy: { changedAt: 'asc' } },
    },
});
const workOrderListInclude = client_1.Prisma.validator()({
    include: {
        client: { select: { id: true, name: true } },
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
    },
});
function round2(value) {
    return Math.round(value * 100) / 100;
}
let WorkOrdersService = class WorkOrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(companyId, userId, dto) {
        await this.assertClientBelongsToCompany(companyId, dto.clientId);
        await this.assertVehicleBelongsToClient(companyId, dto.vehicleId, dto.clientId);
        const items = dto.items ?? [];
        const { laborAmount, partsAmount } = this.sumItemsByType(items);
        const discountAmount = dto.discountAmount ?? 0;
        const totalAmount = round2(laborAmount + partsAmount - discountAmount);
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const created = await this.prisma.$transaction(async (tx) => {
                    const number = await this.nextWorkOrderNumber(tx, companyId);
                    return tx.workOrder.create({
                        data: {
                            companyId,
                            clientId: dto.clientId,
                            vehicleId: dto.vehicleId,
                            number,
                            reportedProblem: dto.reportedProblem,
                            diagnosis: dto.diagnosis,
                            observations: dto.observations,
                            discountAmount,
                            laborAmount,
                            partsAmount,
                            totalAmount,
                            warrantyDays: dto.warrantyDays ?? 0,
                            items: { create: items.map((item) => this.toItemData(item)) },
                            history: { create: { status: client_1.WorkOrderStatus.OPEN, changedById: userId } },
                        },
                        ...workOrderInclude,
                    });
                });
                return this.serialize(created);
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && attempt < 2) {
                    continue;
                }
                throw error;
            }
        }
        throw new common_1.ConflictException('Não foi possível gerar o número da ordem de serviço, tente novamente.');
    }
    async findAll(companyId, query) {
        const { page, limit, search, status, clientId, vehicleId } = query;
        const searchAsNumber = search && /^\d+$/.test(search.trim()) ? Number(search.trim()) : undefined;
        const where = {
            companyId,
            deletedAt: null,
            ...(status && { status }),
            ...(clientId && { clientId }),
            ...(vehicleId && { vehicleId }),
            ...(search && {
                OR: [
                    { reportedProblem: { contains: search, mode: 'insensitive' } },
                    { client: { name: { contains: search, mode: 'insensitive' } } },
                    { vehicle: { plate: { contains: search, mode: 'insensitive' } } },
                    ...(searchAsNumber !== undefined ? [{ number: searchAsNumber }] : []),
                ],
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.workOrder.findMany({
                where,
                orderBy: { openedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                ...workOrderListInclude,
            }),
            this.prisma.workOrder.count({ where }),
        ]);
        return (0, paginated_result_interface_1.paginate)(data.map((wo) => this.serializeListItem(wo)), total, page, limit);
    }
    async findOne(companyId, id) {
        const workOrder = await this.prisma.workOrder.findFirst({
            where: { id, companyId, deletedAt: null },
            ...workOrderInclude,
        });
        if (!workOrder) {
            throw new common_1.NotFoundException('Work order not found');
        }
        return this.serialize(workOrder);
    }
    async update(companyId, id, dto) {
        const existing = await this.assertWorkOrderIsEditable(companyId, id);
        const data = { ...dto };
        if (dto.discountAmount !== undefined) {
            data.totalAmount = round2(Number(existing.laborAmount) + Number(existing.partsAmount) - dto.discountAmount);
        }
        const updated = await this.prisma.workOrder.update({ where: { id }, data, ...workOrderInclude });
        return this.serialize(updated);
    }
    async updateStatus(companyId, id, userId, dto) {
        const existing = await this.prisma.workOrder.findFirst({ where: { id, companyId, deletedAt: null } });
        if (!existing) {
            throw new common_1.NotFoundException('Work order not found');
        }
        if (TERMINAL_STATUSES.includes(existing.status)) {
            throw new common_1.ConflictException('Esta ordem de serviço já foi finalizada e não pode mudar de status.');
        }
        if (dto.status === client_1.WorkOrderStatus.CANCELLED) {
            await this.assertLinkedIncomeIsNotPaid(companyId, id);
        }
        const now = new Date();
        const data = { status: dto.status };
        let completedAtValue = existing.completedAt;
        if (dto.status === client_1.WorkOrderStatus.IN_PROGRESS && !existing.startedAt) {
            data.startedAt = now;
        }
        if (dto.status === client_1.WorkOrderStatus.COMPLETED) {
            data.completedAt = now;
            completedAtValue = now;
        }
        if (dto.status === client_1.WorkOrderStatus.DELIVERED) {
            data.deliveredAt = now;
            if (!existing.completedAt) {
                data.completedAt = now;
                completedAtValue = now;
            }
            if (existing.warrantyDays > 0) {
                const warrantyUntil = new Date(now);
                warrantyUntil.setDate(warrantyUntil.getDate() + existing.warrantyDays);
                data.warrantyUntil = warrantyUntil;
            }
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const workOrder = await tx.workOrder.update({
                where: { id },
                data: { ...data, history: { create: { status: dto.status, notes: dto.notes, changedById: userId } } },
                ...workOrderInclude,
            });
            if (dto.status === client_1.WorkOrderStatus.COMPLETED || dto.status === client_1.WorkOrderStatus.DELIVERED) {
                await this.ensureIncomeForWorkOrder(tx, companyId, workOrder, completedAtValue ?? now);
            }
            if (dto.status === client_1.WorkOrderStatus.CANCELLED) {
                await tx.income.updateMany({
                    where: { workOrderId: id, companyId, deletedAt: null, paidAmount: 0 },
                    data: { status: client_1.FinancialStatus.CANCELLED },
                });
            }
            return workOrder;
        });
        return this.serialize(updated);
    }
    async addItem(companyId, workOrderId, dto) {
        await this.assertWorkOrderIsEditable(companyId, workOrderId);
        await this.prisma.workOrderItem.create({ data: { workOrderId, ...this.toItemData(dto) } });
        await this.recomputeAmounts(workOrderId);
        return this.findOne(companyId, workOrderId);
    }
    async updateItem(companyId, workOrderId, itemId, dto) {
        await this.assertWorkOrderIsEditable(companyId, workOrderId);
        const item = await this.prisma.workOrderItem.findFirst({ where: { id: itemId, workOrderId } });
        if (!item) {
            throw new common_1.NotFoundException('Work order item not found');
        }
        const quantity = dto.quantity ?? Number(item.quantity);
        const unitPrice = dto.unitPrice ?? Number(item.unitPrice);
        await this.prisma.workOrderItem.update({
            where: { id: itemId },
            data: {
                type: dto.type ?? item.type,
                description: dto.description ?? item.description,
                quantity,
                unitPrice,
                totalPrice: round2(quantity * unitPrice),
            },
        });
        await this.recomputeAmounts(workOrderId);
        return this.findOne(companyId, workOrderId);
    }
    async removeItem(companyId, workOrderId, itemId) {
        await this.assertWorkOrderIsEditable(companyId, workOrderId);
        const item = await this.prisma.workOrderItem.findFirst({ where: { id: itemId, workOrderId } });
        if (!item) {
            throw new common_1.NotFoundException('Work order item not found');
        }
        await this.prisma.workOrderItem.delete({ where: { id: itemId } });
        await this.recomputeAmounts(workOrderId);
        return this.findOne(companyId, workOrderId);
    }
    async remove(companyId, id) {
        await this.assertWorkOrderExists(companyId, id);
        await this.prisma.workOrder.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async nextWorkOrderNumber(tx, companyId) {
        const aggregate = await tx.workOrder.aggregate({ where: { companyId }, _max: { number: true } });
        return (aggregate._max.number ?? 0) + 1;
    }
    async recomputeAmounts(workOrderId) {
        const [items, workOrder] = await Promise.all([
            this.prisma.workOrderItem.findMany({ where: { workOrderId } }),
            this.prisma.workOrder.findUniqueOrThrow({ where: { id: workOrderId } }),
        ]);
        const laborAmount = round2(items.filter((item) => item.type === client_1.WorkOrderItemType.SERVICE).reduce((sum, item) => sum + Number(item.totalPrice), 0));
        const partsAmount = round2(items.filter((item) => item.type === client_1.WorkOrderItemType.PART).reduce((sum, item) => sum + Number(item.totalPrice), 0));
        const totalAmount = round2(laborAmount + partsAmount - Number(workOrder.discountAmount));
        const linkedIncome = await this.prisma.income.findFirst({
            where: { workOrderId, companyId: workOrder.companyId, deletedAt: null },
        });
        const shouldSyncIncome = linkedIncome && Number(linkedIncome.paidAmount) === 0 && Number(linkedIncome.amount) !== totalAmount;
        await this.prisma.$transaction([
            this.prisma.workOrder.update({ where: { id: workOrderId }, data: { laborAmount, partsAmount, totalAmount } }),
            ...(shouldSyncIncome ? [this.prisma.income.update({ where: { id: linkedIncome.id }, data: { amount: totalAmount } })] : []),
        ]);
    }
    async ensureIncomeForWorkOrder(tx, companyId, workOrder, dueDate) {
        const existingIncome = await tx.income.findFirst({ where: { workOrderId: workOrder.id, companyId, deletedAt: null } });
        if (existingIncome) {
            return;
        }
        await tx.income.create({
            data: {
                companyId,
                workOrderId: workOrder.id,
                clientId: workOrder.clientId,
                description: `Ordem de serviço #${workOrder.number}`,
                amount: workOrder.totalAmount,
                dueDate,
                status: client_1.FinancialStatus.PENDING,
            },
        });
    }
    async assertLinkedIncomeIsNotPaid(companyId, workOrderId) {
        const linkedIncome = await this.prisma.income.findFirst({ where: { workOrderId, companyId, deletedAt: null } });
        if (linkedIncome && Number(linkedIncome.paidAmount) > 0) {
            throw new common_1.ConflictException('Não é possível cancelar esta ordem de serviço: a receita vinculada já possui pagamentos registrados.');
        }
    }
    sumItemsByType(items) {
        let laborAmount = 0;
        let partsAmount = 0;
        for (const item of items) {
            const total = round2(item.quantity * item.unitPrice);
            if (item.type === client_1.WorkOrderItemType.SERVICE) {
                laborAmount = round2(laborAmount + total);
            }
            else {
                partsAmount = round2(partsAmount + total);
            }
        }
        return { laborAmount, partsAmount };
    }
    toItemData(item) {
        return {
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: round2(item.quantity * item.unitPrice),
        };
    }
    async assertWorkOrderExists(companyId, id) {
        const exists = await this.prisma.workOrder.findFirst({ where: { id, companyId, deletedAt: null }, select: { id: true } });
        if (!exists) {
            throw new common_1.NotFoundException('Work order not found');
        }
    }
    async assertWorkOrderIsEditable(companyId, id) {
        const workOrder = await this.prisma.workOrder.findFirst({ where: { id, companyId, deletedAt: null } });
        if (!workOrder) {
            throw new common_1.NotFoundException('Work order not found');
        }
        if (TERMINAL_STATUSES.includes(workOrder.status)) {
            throw new common_1.ConflictException('Esta ordem de serviço já foi finalizada e não pode ser alterada.');
        }
        return workOrder;
    }
    async assertClientBelongsToCompany(companyId, clientId) {
        const client = await this.prisma.client.findFirst({ where: { id: clientId, companyId, deletedAt: null } });
        if (!client) {
            throw new common_1.NotFoundException('Client not found');
        }
    }
    async assertVehicleBelongsToClient(companyId, vehicleId, clientId) {
        const vehicle = await this.prisma.vehicle.findFirst({ where: { id: vehicleId, companyId, deletedAt: null } });
        if (!vehicle) {
            throw new common_1.NotFoundException('Vehicle not found');
        }
        if (vehicle.clientId !== clientId) {
            throw new common_1.BadRequestException('O veículo informado não pertence ao cliente informado.');
        }
    }
    serialize(workOrder) {
        return {
            ...workOrder,
            laborAmount: Number(workOrder.laborAmount),
            partsAmount: Number(workOrder.partsAmount),
            discountAmount: Number(workOrder.discountAmount),
            totalAmount: Number(workOrder.totalAmount),
            items: workOrder.items.map((item) => ({
                ...item,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.totalPrice),
            })),
        };
    }
    serializeListItem(workOrder) {
        return {
            ...workOrder,
            laborAmount: Number(workOrder.laborAmount),
            partsAmount: Number(workOrder.partsAmount),
            discountAmount: Number(workOrder.discountAmount),
            totalAmount: Number(workOrder.totalAmount),
        };
    }
};
exports.WorkOrdersService = WorkOrdersService;
exports.WorkOrdersService = WorkOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkOrdersService);
//# sourceMappingURL=work-orders.service.js.map