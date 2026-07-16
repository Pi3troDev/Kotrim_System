import { FinancialStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
export declare class QueryExpensesDto extends PaginationQueryDto {
    status?: FinancialStatus;
    categoryId?: string;
}
