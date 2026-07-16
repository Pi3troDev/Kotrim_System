import { Supplier } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySuppliersDto } from './dto/query-suppliers.dto';
export declare class SuppliersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(companyId: string, dto: CreateSupplierDto): Promise<Supplier>;
    findAll(companyId: string, query: QuerySuppliersDto): Promise<PaginatedResult<Supplier>>;
    findOne(companyId: string, id: string): Promise<Supplier>;
    update(companyId: string, id: string, dto: UpdateSupplierDto): Promise<Supplier>;
    remove(companyId: string, id: string): Promise<void>;
    private assertDocumentIsUnique;
}
