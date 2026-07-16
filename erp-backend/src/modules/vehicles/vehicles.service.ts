import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehiclesDto } from './dto/query-vehicles.dto';

const vehicleWithClient = Prisma.validator<Prisma.VehicleDefaultArgs>()({
  include: { client: { select: { id: true, name: true } } },
});
type VehicleWithClient = Prisma.VehicleGetPayload<typeof vehicleWithClient>;

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateVehicleDto): Promise<VehicleWithClient> {
    await this.assertClientBelongsToCompany(companyId, dto.clientId);
    await this.assertPlateIsUnique(companyId, dto.plate);

    return this.prisma.vehicle.create({
      data: { ...dto, plate: dto.plate.toUpperCase(), companyId },
      ...vehicleWithClient,
    });
  }

  async findAll(companyId: string, query: QueryVehiclesDto): Promise<PaginatedResult<VehicleWithClient>> {
    const { page, limit, search, clientId } = query;

    const where: Prisma.VehicleWhereInput = {
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

    return paginate(data, total, page, limit);
  }

  async findOne(companyId: string, id: string): Promise<VehicleWithClient> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, companyId, deletedAt: null },
      ...vehicleWithClient,
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async update(companyId: string, id: string, dto: UpdateVehicleDto): Promise<VehicleWithClient> {
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

  async remove(companyId: string, id: string): Promise<void> {
    await this.findOne(companyId, id);

    await this.prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async assertClientBelongsToCompany(companyId: string, clientId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId, deletedAt: null },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }
  }

  private async assertPlateIsUnique(companyId: string, plate: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.vehicle.findFirst({
      where: {
        companyId,
        plate: plate.toUpperCase(),
        deletedAt: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (existing) {
      throw new ConflictException('A vehicle with this plate already exists');
    }
  }
}
