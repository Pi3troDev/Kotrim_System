import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
export declare class QueryInventoryItemsDto extends PaginationQueryDto {
    categoryId?: string;
    supplierId?: string;
    lowStockOnly?: boolean;
}
