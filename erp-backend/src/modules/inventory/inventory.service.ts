import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma, StockMovementType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { QueryInventoryItemsDto } from './dto/query-inventory-items.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

const itemInclude = Prisma.validator<Prisma.InventoryItemDefaultArgs>()({
  include: {
    category: { select: { id: true, name: true } },
    supplier: { select: { id: true, name: true } },
  },
});
type InventoryItemWithRelations = Prisma.InventoryItemGetPayload<typeof itemInclude>;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateInventoryItemDto) {
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
              type: StockMovementType.IN,
              quantity: initialQuantity,
              reason: 'Estoque inicial',
            },
          });
        }

        return item;
      });

      return this.serialize(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um item com este SKU.');
      }
      throw error;
    }
  }

  async findAll(companyId: string, query: QueryInventoryItemsDto): Promise<PaginatedResult<ReturnType<typeof this.serialize>>> {
    const { page, limit, search, categoryId, supplierId, lowStockOnly } = query;

    let lowStockIds: string[] | undefined;
    if (lowStockOnly) {
      const rows = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT "id" FROM "InventoryItem"
        WHERE "companyId" = ${companyId}::uuid AND "deletedAt" IS NULL AND "quantityInStock" <= "minimumStock"
      `);
      lowStockIds = rows.map((row) => row.id);
    }

    const where: Prisma.InventoryItemWhereInput = {
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

    return paginate(data.map((item) => this.serialize(item)), total, page, limit);
  }

  async findOne(companyId: string, id: string) {
    const item = await this.prisma.inventoryItem.findFirst({ where: { id, companyId, deletedAt: null }, ...itemInclude });
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }
    return this.serialize(item);
  }

  async update(companyId: string, id: string, dto: UpdateInventoryItemDto) {
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um item com este SKU.');
      }
      throw error;
    }
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.assertItemExists(companyId, id);
    await this.prisma.inventoryItem.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async createMovement(companyId: string, itemId: string, userId: string, dto: CreateStockMovementDto) {
    const item = await this.prisma.inventoryItem.findFirst({ where: { id: itemId, companyId, deletedAt: null } });
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    const currentQuantity = Number(item.quantityInStock);
    let newQuantity: number;

    if (dto.type === StockMovementType.ADJUSTMENT) {
      newQuantity = round2(dto.quantity);
    } else {
      if (dto.quantity <= 0) {
        throw new BadRequestException('A quantidade deve ser maior que zero.');
      }
      newQuantity =
        dto.type === StockMovementType.IN
          ? round2(currentQuantity + dto.quantity)
          : round2(currentQuantity - dto.quantity);

      if (newQuantity < 0) {
        throw new BadRequestException('Estoque insuficiente para esta saída.');
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

  async listMovements(companyId: string, itemId: string) {
    await this.assertItemExists(companyId, itemId);

    const movements = await this.prisma.stockMovement.findMany({
      where: { inventoryItemId: itemId, companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return movements.map((movement) => ({ ...movement, quantity: Number(movement.quantity) }));
  }

  /**
   * Deducts stock for a part consumed by a work order, inside the caller's
   * transaction — this must land atomically with whatever wrote the
   * WorkOrderItem, or the two can drift apart on a mid-write crash.
   *
   * Throws rather than letting stock go negative, same rule as the manual
   * OUT movement in `createMovement`. `referenceId` is the work order's id,
   * so `StockMovement` history reads the same as any other movement.
   */
  async deductStock(
    tx: Prisma.TransactionClient,
    companyId: string,
    inventoryItemId: string,
    quantity: number,
    referenceId: string,
  ): Promise<void> {
    const item = await tx.inventoryItem.findFirst({ where: { id: inventoryItemId, companyId, deletedAt: null } });
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    const currentQuantity = Number(item.quantityInStock);
    const minimumStock = Number(item.minimumStock);
    const newQuantity = round2(currentQuantity - quantity);

    if (newQuantity < 0) {
      throw new BadRequestException(`Estoque insuficiente para "${item.name}" (disponível: ${currentQuantity}).`);
    }

    await tx.inventoryItem.update({ where: { id: inventoryItemId }, data: { quantityInStock: newQuantity } });
    await tx.stockMovement.create({
      data: {
        companyId,
        inventoryItemId,
        type: StockMovementType.OUT,
        quantity,
        reason: 'Baixa automática (ordem de serviço)',
        referenceId,
      },
    });

    // Warn only on the crossing, not on every subsequent deduction while
    // already low — otherwise every part added to an OS after the item first
    // dips below minimum re-notifies everyone for no new information.
    if (currentQuantity > minimumStock && newQuantity <= minimumStock) {
      await this.notifyLowStock(tx, companyId, item.name, newQuantity, minimumStock);
    }
  }

  /**
   * Reverses a prior automatic deduction — a work-order item removed, or the
   * whole work order cancelled. Silently no-ops if the item itself is gone
   * (soft-deleted since), since that must never block removing/cancelling
   * the work order it was linked from.
   */
  async restoreStock(
    tx: Prisma.TransactionClient,
    companyId: string,
    inventoryItemId: string,
    quantity: number,
    referenceId: string,
    reason: string,
  ): Promise<void> {
    const item = await tx.inventoryItem.findFirst({ where: { id: inventoryItemId, companyId } });
    if (!item) {
      return;
    }

    const newQuantity = round2(Number(item.quantityInStock) + quantity);

    await tx.inventoryItem.update({ where: { id: inventoryItemId }, data: { quantityInStock: newQuantity } });
    await tx.stockMovement.create({
      data: { companyId, inventoryItemId, type: StockMovementType.IN, quantity, reason, referenceId },
    });
  }

  /** One notification row per active user of the company — mirrors the trial/renewal alert fan-out. */
  private async notifyLowStock(
    tx: Prisma.TransactionClient,
    companyId: string,
    itemName: string,
    quantityInStock: number,
    minimumStock: number,
  ): Promise<void> {
    const users = await tx.user.findMany({ where: { companyId, deletedAt: null, isActive: true }, select: { id: true } });
    if (users.length === 0) return;

    await tx.notification.createMany({
      data: users.map((user) => ({
        companyId,
        userId: user.id,
        type: NotificationType.WARNING,
        title: 'Estoque baixo',
        message: `"${itemName}" está com estoque baixo: restam ${quantityInStock}, mínimo configurado é ${minimumStock}.`,
        link: '/inventory',
      })),
    });
  }

  private async assertItemExists(companyId: string, id: string): Promise<void> {
    const exists = await this.prisma.inventoryItem.findFirst({ where: { id, companyId, deletedAt: null }, select: { id: true } });
    if (!exists) {
      throw new NotFoundException('Inventory item not found');
    }
  }

  private async assertCategoryBelongsToCompany(companyId: string, categoryId: string): Promise<void> {
    const category = await this.prisma.category.findFirst({ where: { id: categoryId, companyId, deletedAt: null } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }

  private async assertSupplierBelongsToCompany(companyId: string, supplierId: string): Promise<void> {
    const supplier = await this.prisma.supplier.findFirst({ where: { id: supplierId, companyId, deletedAt: null } });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
  }

  private serialize(item: InventoryItemWithRelations) {
    return {
      ...item,
      costPrice: Number(item.costPrice),
      salePrice: Number(item.salePrice),
      quantityInStock: Number(item.quantityInStock),
      minimumStock: Number(item.minimumStock),
    };
  }
}
