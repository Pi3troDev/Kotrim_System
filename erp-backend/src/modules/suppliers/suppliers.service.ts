import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Supplier } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySuppliersDto } from './dto/query-suppliers.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateSupplierDto): Promise<Supplier> {
    if (dto.document) {
      await this.assertDocumentIsUnique(companyId, dto.document);
    }

    return this.prisma.supplier.create({ data: { ...dto, companyId } });
  }

  async findAll(companyId: string, query: QuerySuppliersDto): Promise<PaginatedResult<Supplier>> {
    const { page, limit, search } = query;

    const where: Prisma.SupplierWhereInput = {
      companyId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { document: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(companyId: string, id: string): Promise<Supplier> {
    const supplier = await this.prisma.supplier.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
    return supplier;
  }

  async update(companyId: string, id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    await this.findOne(companyId, id);

    if (dto.document) {
      await this.assertDocumentIsUnique(companyId, dto.document, id);
    }

    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.findOne(companyId, id);
    await this.prisma.supplier.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async assertDocumentIsUnique(companyId: string, document: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.supplier.findFirst({
      where: { companyId, document, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
    });

    if (existing) {
      throw new ConflictException('A supplier with this document already exists');
    }
  }
}
