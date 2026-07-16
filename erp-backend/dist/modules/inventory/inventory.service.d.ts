import { PrismaService } from '../../prisma/prisma.service';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { QueryInventoryItemsDto } from './dto/query-inventory-items.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
export declare class InventoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(companyId: string, dto: CreateInventoryItemDto): Promise<{
        costPrice: number;
        salePrice: number;
        quantityInStock: number;
        minimumStock: number;
        category: {
            name: string;
            id: string;
        } | null;
        supplier: {
            name: string;
            id: string;
        } | null;
        name: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        categoryId: string | null;
        sku: string | null;
        unit: string;
        location: string | null;
        supplierId: string | null;
    }>;
    findAll(companyId: string, query: QueryInventoryItemsDto): Promise<PaginatedResult<ReturnType<typeof this.serialize>>>;
    findOne(companyId: string, id: string): Promise<{
        costPrice: number;
        salePrice: number;
        quantityInStock: number;
        minimumStock: number;
        category: {
            name: string;
            id: string;
        } | null;
        supplier: {
            name: string;
            id: string;
        } | null;
        name: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        categoryId: string | null;
        sku: string | null;
        unit: string;
        location: string | null;
        supplierId: string | null;
    }>;
    update(companyId: string, id: string, dto: UpdateInventoryItemDto): Promise<{
        costPrice: number;
        salePrice: number;
        quantityInStock: number;
        minimumStock: number;
        category: {
            name: string;
            id: string;
        } | null;
        supplier: {
            name: string;
            id: string;
        } | null;
        name: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        categoryId: string | null;
        sku: string | null;
        unit: string;
        location: string | null;
        supplierId: string | null;
    }>;
    remove(companyId: string, id: string): Promise<void>;
    createMovement(companyId: string, itemId: string, userId: string, dto: CreateStockMovementDto): Promise<{
        costPrice: number;
        salePrice: number;
        quantityInStock: number;
        minimumStock: number;
        category: {
            name: string;
            id: string;
        } | null;
        supplier: {
            name: string;
            id: string;
        } | null;
        name: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        categoryId: string | null;
        sku: string | null;
        unit: string;
        location: string | null;
        supplierId: string | null;
    }>;
    listMovements(companyId: string, itemId: string): Promise<{
        quantity: number;
        id: string;
        companyId: string;
        createdAt: Date;
        type: import("@prisma/client").$Enums.StockMovementType;
        userId: string | null;
        inventoryItemId: string;
        reason: string | null;
        referenceId: string | null;
    }[]>;
    private assertItemExists;
    private assertCategoryBelongsToCompany;
    private assertSupplierBelongsToCompany;
    private serialize;
}
