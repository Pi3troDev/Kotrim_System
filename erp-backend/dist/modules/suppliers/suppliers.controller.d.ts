import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySuppliersDto } from './dto/query-suppliers.dto';
export declare class SuppliersController {
    private readonly suppliersService;
    constructor(suppliersService: SuppliersService);
    create(user: AuthenticatedUser, dto: CreateSupplierDto): Promise<{
        name: string;
        id: string;
        companyId: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        document: string | null;
        phone: string | null;
        address: string | null;
        notes: string | null;
    }>;
    findAll(user: AuthenticatedUser, query: QuerySuppliersDto): Promise<import("../../common/interfaces/paginated-result.interface").PaginatedResult<{
        name: string;
        id: string;
        companyId: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        document: string | null;
        phone: string | null;
        address: string | null;
        notes: string | null;
    }>>;
    findOne(user: AuthenticatedUser, id: string): Promise<{
        name: string;
        id: string;
        companyId: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        document: string | null;
        phone: string | null;
        address: string | null;
        notes: string | null;
    }>;
    update(user: AuthenticatedUser, id: string, dto: UpdateSupplierDto): Promise<{
        name: string;
        id: string;
        companyId: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        document: string | null;
        phone: string | null;
        address: string | null;
        notes: string | null;
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<void>;
}
