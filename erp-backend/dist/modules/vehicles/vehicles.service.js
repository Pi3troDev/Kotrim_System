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
exports.VehiclesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const paginated_result_interface_1 = require("../../common/interfaces/paginated-result.interface");
const vehicleWithClient = client_1.Prisma.validator()({
    include: { client: { select: { id: true, name: true } } },
});
let VehiclesService = class VehiclesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(companyId, dto) {
        await this.assertClientBelongsToCompany(companyId, dto.clientId);
        await this.assertPlateIsUnique(companyId, dto.plate);
        return this.prisma.vehicle.create({
            data: { ...dto, plate: dto.plate.toUpperCase(), companyId },
            ...vehicleWithClient,
        });
    }
    async findAll(companyId, query) {
        const { page, limit, search, clientId } = query;
        const where = {
            companyId,
            deletedAt: null,
            ...(clientId && { clientId }),
            ...(search && {
                OR: [
                    { plate: { contains: search, mode: 'insensitive' } },
                    { brand: { contains: search, mode: 'insensitive' } },
                    { model: { contains: search, mode: 'insensitive' } },
                    { chassisNumber: { contains: search, mode: 'insensitive' } },
                    { client: { name: { contains: search, mode: 'insensitive' } } },
                ],
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.vehicle.findMany({
                where,
                orderBy: { plate: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
                ...vehicleWithClient,
            }),
            this.prisma.vehicle.count({ where }),
        ]);
        return (0, paginated_result_interface_1.paginate)(data, total, page, limit);
    }
    async findOne(companyId, id) {
        const vehicle = await this.prisma.vehicle.findFirst({
            where: { id, companyId, deletedAt: null },
            ...vehicleWithClient,
        });
        if (!vehicle) {
            throw new common_1.NotFoundException('Vehicle not found');
        }
        return vehicle;
    }
    async update(companyId, id, dto) {
        await this.findOne(companyId, id);
        if (dto.clientId) {
            await this.assertClientBelongsToCompany(companyId, dto.clientId);
        }
        if (dto.plate) {
            await this.assertPlateIsUnique(companyId, dto.plate, id);
        }
        return this.prisma.vehicle.update({
            where: { id },
            data: { ...dto, ...(dto.plate && { plate: dto.plate.toUpperCase() }) },
            ...vehicleWithClient,
        });
    }
    async remove(companyId, id) {
        await this.findOne(companyId, id);
        await this.prisma.vehicle.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async assertClientBelongsToCompany(companyId, clientId) {
        const client = await this.prisma.client.findFirst({
            where: { id: clientId, companyId, deletedAt: null },
        });
        if (!client) {
            throw new common_1.NotFoundException('Client not found');
        }
    }
    async assertPlateIsUnique(companyId, plate, excludeId) {
        const existing = await this.prisma.vehicle.findFirst({
            where: {
                companyId,
                plate: plate.toUpperCase(),
                deletedAt: null,
                ...(excludeId && { id: { not: excludeId } }),
            },
        });
        if (existing) {
            throw new common_1.ConflictException('A vehicle with this plate already exists');
        }
    }
};
exports.VehiclesService = VehiclesService;
exports.VehiclesService = VehiclesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VehiclesService);
//# sourceMappingURL=vehicles.service.js.map