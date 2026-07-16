import { WorkOrderStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
export declare class QueryWorkOrdersDto extends PaginationQueryDto {
    status?: WorkOrderStatus;
    clientId?: string;
    vehicleId?: string;
}
