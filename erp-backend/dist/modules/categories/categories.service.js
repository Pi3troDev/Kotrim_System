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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(companyId, dto) {
        await this.assertNameIsUnique(companyId, dto.name, dto.type);
        return this.prisma.category.create({ data: { ...dto, companyId } });
    }
    async findAll(companyId, query) {
        const where = {
            companyId,
            deletedAt: null,
            ...(query.type && { type: query.type }),
        };
        return this.prisma.category.findMany({ where, orderBy: { name: 'asc' } });
    }
    async findOne(companyId, id) {
        const category = await this.prisma.category.findFirst({ where: { id, companyId, deletedAt: null } });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        return category;
    }
    async update(companyId, id, dto) {
        const existing = await this.findOne(companyId, id);
        if (dto.name) {
            await this.assertNameIsUnique(companyId, dto.name, existing.type, id);
        }
        return this.prisma.category.update({ where: { id }, data: dto });
    }
    async remove(companyId, id) {
        await this.findOne(companyId, id);
        await this.prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async assertNameIsUnique(companyId, name, type, excludeId) {
        const existing = await this.prisma.category.findFirst({
            where: { companyId, name, type, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
        });
        if (existing) {
            throw new common_1.ConflictException('A category with this name already exists');
        }
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map