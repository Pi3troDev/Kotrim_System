import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehiclesDto } from './dto/query-vehicles.dto';
export declare class VehiclesController {
    private readonly vehiclesService;
    constructor(vehiclesService: VehiclesService);
    create(user: AuthenticatedUser, dto: CreateVehicleDto): Promise<{
        client: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        year: number | null;
        clientId: string;
        notes: string | null;
        plate: string;
        brand: string;
        model: string;
        color: string | null;
        chassisNumber: string | null;
        mileage: number | null;
    }>;
    findAll(user: AuthenticatedUser, query: QueryVehiclesDto): Promise<import("../../common/interfaces/paginated-result.interface").PaginatedResult<{
        client: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        year: number | null;
        clientId: string;
        notes: string | null;
        plate: string;
        brand: string;
        model: string;
        color: string | null;
        chassisNumber: string | null;
        mileage: number | null;
    }>>;
    findOne(user: AuthenticatedUser, id: string): Promise<{
        client: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        year: number | null;
        clientId: string;
        notes: string | null;
        plate: string;
        brand: string;
        model: string;
        color: string | null;
        chassisNumber: string | null;
        mileage: number | null;
    }>;
    update(user: AuthenticatedUser, id: string, dto: UpdateVehicleDto): Promise<{
        client: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        year: number | null;
        clientId: string;
        notes: string | null;
        plate: string;
        brand: string;
        model: string;
        color: string | null;
        chassisNumber: string | null;
        mileage: number | null;
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<void>;
}
