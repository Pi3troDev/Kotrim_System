import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { QueryInventoryItemsDto } from './dto/query-inventory-items.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    create(user: AuthenticatedUser, dto: CreateInventoryItemDto): Promise<{
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
    findAll(user: AuthenticatedUser, query: QueryInventoryItemsDto): Promise<import("../../common/interfaces/paginated-result.interface").PaginatedResult<{
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
    }>>;
    findOne(user: AuthenticatedUser, id: string): Promise<{
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
    update(user: AuthenticatedUser, id: string, dto: UpdateInventoryItemDto): Promise<{
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
    remove(user: AuthenticatedUser, id: string): Promise<void>;
    createMovement(user: AuthenticatedUser, id: string, dto: CreateStockMovementDto): Promise<{
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
    listMovements(user: AuthenticatedUser, id: string): Promise<{
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
}
