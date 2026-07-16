import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryVehiclesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter vehicles belonging to a specific client' })
  @IsOptional()
  @IsUUID()
  clientId?: string;
}
