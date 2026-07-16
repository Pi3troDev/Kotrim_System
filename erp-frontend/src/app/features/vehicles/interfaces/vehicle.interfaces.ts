export interface VehicleClientSummary {
  id: string;
  name: string;
}

export interface Vehicle {
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
  client: VehicleClientSummary;
  createdAt: string;
  updatedAt: string;
}

export type CreateVehiclePayload = Pick<Vehicle, 'clientId' | 'plate' | 'brand' | 'model'> &
  Partial<Pick<Vehicle, 'year' | 'color' | 'chassisNumber' | 'mileage' | 'notes'>>;

export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;
