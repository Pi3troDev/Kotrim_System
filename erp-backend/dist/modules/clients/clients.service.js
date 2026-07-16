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
exports.ClientsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const paginated_result_interface_1 = require("../../common/interfaces/paginated-result.interface");
let ClientsService = class ClientsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(companyId, dto) {
        if (dto.document) {
            await this.assertDocumentIsUnique(companyId, dto.document);
        }
        return this.prisma.client.create({
            data: { ...dto, companyId },
        });
    }
    async findAll(companyId, query) {
        const { page, limit, search } = query;
        const where = {
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
        return (0, paginated_result_interface_1.paginate)(data, total, page, limit);
    }
    async findOne(companyId, id) {
        const client = await this.prisma.client.findFirst({
            where: { id, companyId, deletedAt: null },
        });
        if (!client) {
            throw new common_1.NotFoundException('Client not found');
        }
        return client;
    }
    async update(companyId, id, dto) {
        await this.findOne(companyId, id);
        if (dto.document) {
            await this.assertDocumentIsUnique(companyId, dto.document, id);
        }
        return this.prisma.client.update({
            where: { id },
            data: dto,
        });
    }
    async remove(companyId, id) {
        await this.findOne(companyId, id);
        await this.prisma.client.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async assertDocumentIsUnique(companyId, document, excludeId) {
        const existing = await this.prisma.client.findFirst({
            where: { companyId, document, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
        });
        if (existing) {
            throw new common_1.ConflictException('A client with this document already exists');
        }
    }
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClientsService);
//# sourceMappingURL=clients.service.js.map