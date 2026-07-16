import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehiclesDto } from './dto/query-vehicles.dto';
declare const vehicleWithClient: {
    include: {
        client: {
            select: {
                id: true;
                name: true;
            };
        };
    };
};
type VehicleWithClient = Prisma.VehicleGetPayload<typeof vehicleWithClient>;
export declare class VehiclesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(companyId: string, dto: CreateVehicleDto): Promise<VehicleWithClient>;
    findAll(companyId: string, query: QueryVehiclesDto): Promise<PaginatedResult<VehicleWithClient>>;
    findOne(companyId: string, id: string): Promise<VehicleWithClient>;
    update(companyId: string, id: string, dto: UpdateVehicleDto): Promise<VehicleWithClient>;
    remove(companyId: string, id: string): Promise<void>;
    private assertClientBelongsToCompany;
    private assertPlateIsUnique;
}
export {};
