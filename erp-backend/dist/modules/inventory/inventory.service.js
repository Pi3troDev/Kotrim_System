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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const paginated_result_interface_1 = require("../../common/interfaces/paginated-result.interface");
const itemInclude = client_1.Prisma.validator()({
    include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
    },
});
function round2(value) {
    return Math.round(value * 100) / 100;
}
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(companyId, dto) {
        if (dto.categoryId) {
            await this.assertCategoryBelongsToCompany(companyId, dto.categoryId);
        }
        if (dto.supplierId) {
            await this.assertSupplierBelongsToCompany(companyId, dto.supplierId);
        }
        const initialQuantity = dto.initialQuantity ?? 0;
        try {
            const created = await this.prisma.$transaction(async (tx) => {
                const item = await tx.inventoryItem.create({
                    data: {
                        companyId,
                        name: dto.name,
                        sku: dto.sku,
                        description: dto.description,
                        unit: dto.unit ?? 'UN',
                        costPrice: dto.costPrice ?? 0,
                        salePrice: dto.salePrice ?? 0,
                        minimumStock: dto.minimumStock ?? 0,
                        location: dto.location,
                        categoryId: dto.categoryId,
                        supplierId: dto.supplierId,
                        quantityInStock: initialQuantity,
                    },
                    ...itemInclude,
                });
                if (initialQuantity > 0) {
                    await tx.stockMovement.create({
                        data: {
                            companyId,
                            inventoryItemId: item.id,
                            type: client_1.StockMovementType.IN,
                            quantity: initialQuantity,
                            reason: 'Estoque inicial',
                        },
                    });
                }
                return item;
            });
            return this.serialize(created);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new common_1.ConflictException('Já existe um item com este SKU.');
            }
            throw error;
        }
    }
    async findAll(companyId, query) {
        const { page, limit, search, categoryId, supplierId, lowStockOnly } = query;
        let lowStockIds;
        if (lowStockOnly) {
            const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `
        SELECT "id" FROM "InventoryItem"
        WHERE "companyId" = ${companyId}::uuid AND "deletedAt" IS NULL AND "quantityInStock" <= "minimumStock"
      `);
            lowStockIds = rows.map((row) => row.id);
        }
        const where = {
            companyId,
            deletedAt: null,
            ...(categoryId && { categoryId }),
            ...(supplierId && { supplierId }),
            ...(lowStockIds && { id: { in: lowStockIds } }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.inventoryItem.findMany({
                where,
                orderBy: { name: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
                ...itemInclude,
            }),
            this.prisma.inventoryItem.count({ where }),
        ]);
        return (0, paginated_result_interface_1.paginate)(data.map((item) => this.serialize(item)), total, page, limit);
    }
    async findOne(companyId, id) {
        const item = await this.prisma.inventoryItem.findFirst({ where: { id, companyId, deletedAt: null }, ...itemInclude });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        return this.serialize(item);
    }
    async update(companyId, id, dto) {
        await this.assertItemExists(companyId, id);
        if (dto.categoryId) {
            await this.assertCategoryBelongsToCompany(companyId, dto.categoryId);
        }
        if (dto.supplierId) {
            await this.assertSupplierBelongsToCompany(companyId, dto.supplierId);
        }
        try {
            const updated = await this.prisma.inventoryItem.update({ where: { id }, data: dto, ...itemInclude });
            return this.serialize(updated);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new common_1.ConflictException('Já existe um item com este SKU.');
            }
            throw error;
        }
    }
    async remove(companyId, id) {
        await this.assertItemExists(companyId, id);
        await this.prisma.inventoryItem.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async createMovement(companyId, itemId, userId, dto) {
        const item = await this.prisma.inventoryItem.findFirst({ where: { id: itemId, companyId, deletedAt: null } });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        const currentQuantity = Number(item.quantityInStock);
        let newQuantity;
        if (dto.type === client_1.StockMovementType.ADJUSTMENT) {
            newQuantity = round2(dto.quantity);
        }
        else {
            if (dto.quantity <= 0) {
                throw new common_1.BadRequestException('A quantidade deve ser maior que zero.');
            }
            newQuantity =
                dto.type === client_1.StockMovementType.IN
                    ? round2(currentQuantity + dto.quantity)
                    : round2(currentQuantity - dto.quantity);
            if (newQuantity < 0) {
                throw new common_1.BadRequestException('Estoque insuficiente para esta saída.');
            }
        }
        await this.prisma.$transaction([
            this.prisma.inventoryItem.update({ where: { id: itemId }, data: { quantityInStock: newQuantity } }),
            this.prisma.stockMovement.create({
                data: {
                    companyId,
                    inventoryItemId: itemId,
                    userId,
                    type: dto.type,
                    quantity: dto.quantity,
                    reason: dto.reason,
                },
            }),
        ]);
        return this.findOne(companyId, itemId);
    }
    async listMovements(companyId, itemId) {
        await this.assertItemExists(companyId, itemId);
        const movements = await this.prisma.stockMovement.findMany({
            where: { inventoryItemId: itemId, companyId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return movements.map((movement) => ({ ...movement, quantity: Number(movement.quantity) }));
    }
    async assertItemExists(companyId, id) {
        const exists = await this.prisma.inventoryItem.findFirst({ where: { id, companyId, deletedAt: null }, select: { id: true } });
        if (!exists) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
    }
    async assertCategoryBelongsToCompany(companyId, categoryId) {
        const category = await this.prisma.category.findFirst({ where: { id: categoryId, companyId, deletedAt: null } });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
    }
    async assertSupplierBelongsToCompany(companyId, supplierId) {
        const supplier = await this.prisma.supplier.findFirst({ where: { id: supplierId, companyId, deletedAt: null } });
        if (!supplier) {
            throw new common_1.NotFoundException('Supplier not found');
        }
    }
    serialize(item) {
        return {
            ...item,
            costPrice: Number(item.costPrice),
            salePrice: Number(item.salePrice),
            quantityInStock: Number(item.quantityInStock),
            minimumStock: Number(item.minimumStock),
        };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map