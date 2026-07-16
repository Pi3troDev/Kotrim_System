import { CreateWorkOrderDto } from './create-work-order.dto';
declare const UpdateWorkOrderDto_base: import("@nestjs/common").Type<Partial<Omit<CreateWorkOrderDto, "items" | "clientId" | "vehicleId">>>;
export declare class UpdateWorkOrderDto extends UpdateWorkOrderDto_base {
}
export {};
