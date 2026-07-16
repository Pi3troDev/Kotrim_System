import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Client, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateClientDto): Promise<Client> {
    if (dto.document) {
      await this.assertDocumentIsUnique(companyId, dto.document);
    }

    return this.prisma.client.create({
      data: { ...dto, companyId },
    });
  }

  async findAll(companyId: string, query: QueryClientsDto): Promise<PaginatedResult<Client>> {
    const { page, limit, search } = query;

    const where: Prisma.ClientWhereInput = {
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
      this.prisma.client.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(companyId: string, id: string): Promise<Client> {
    const client = await this.prisma.client.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async update(companyId: string, id: string, dto: UpdateClientDto): Promise<Client> {
    await this.findOne(companyId, id);

    if (dto.document) {
      await this.assertDocumentIsUnique(companyId, dto.document, id);
    }

    return this.prisma.client.update({
      where: { id },
      data: dto,
    });
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.findOne(companyId, id);

    await this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async assertDocumentIsUnique(companyId: string, document: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.client.findFirst({
      where: { companyId, document, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
    });

    if (existing) {
      throw new ConflictException('A client with this document already exists');
    }
  }
}
