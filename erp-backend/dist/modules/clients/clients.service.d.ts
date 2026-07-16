import { Client } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
export declare class ClientsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(companyId: string, dto: CreateClientDto): Promise<Client>;
    findAll(companyId: string, query: QueryClientsDto): Promise<PaginatedResult<Client>>;
    findOne(companyId: string, id: string): Promise<Client>;
    update(companyId: string, id: string, dto: UpdateClientDto): Promise<Client>;
    remove(companyId: string, id: string): Promise<void>;
    private assertDocumentIsUnique;
}
