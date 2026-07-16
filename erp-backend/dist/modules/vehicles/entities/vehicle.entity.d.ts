export declare class VehicleEntity {
    id: string;
    clientId: string;
    plate: string;
    brand: string;
    model: string;
    year?: number | null;
    color?: string | null;
    chassisNumber?: string | null;
    mileage?: number | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
