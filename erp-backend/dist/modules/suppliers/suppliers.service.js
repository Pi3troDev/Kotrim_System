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
exports.SuppliersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const paginated_result_interface_1 = require("../../common/interfaces/paginated-result.interface");
let SuppliersService = class SuppliersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(companyId, dto) {
        if (dto.document) {
            await this.assertDocumentIsUnique(companyId, dto.document);
        }
        return this.prisma.supplier.create({ data: { ...dto, companyId } });
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
            this.prisma.supplier.findMany({
                where,
                orderBy: { name: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.supplier.count({ where }),
        ]);
        return (0, paginated_result_interface_1.paginate)(data, total, page, limit);
    }
    async findOne(companyId, id) {
        const supplier = await this.prisma.supplier.findFirst({ where: { id, companyId, deletedAt: null } });
        if (!supplier) {
            throw new common_1.NotFoundException('Supplier not found');
        }
        return supplier;
    }
    async update(companyId, id, dto) {
        await this.findOne(companyId, id);
        if (dto.document) {
            await this.assertDocumentIsUnique(companyId, dto.document, id);
        }
        return this.prisma.supplier.update({ where: { id }, data: dto });
    }
    async remove(companyId, id) {
        await this.findOne(companyId, id);
        await this.prisma.supplier.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async assertDocumentIsUnique(companyId, document, excludeId) {
        const existing = await this.prisma.supplier.findFirst({
            where: { companyId, document, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
        });
        if (existing) {
            throw new common_1.ConflictException('A supplier with this document already exists');
        }
    }
};
exports.SuppliersService = SuppliersService;
exports.SuppliersService = SuppliersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SuppliersService);
//# sourceMappingURL=suppliers.service.js.map