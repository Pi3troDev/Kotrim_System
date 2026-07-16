import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
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
