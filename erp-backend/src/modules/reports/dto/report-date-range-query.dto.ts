import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class ReportDateRangeQueryDto {
  @ApiPropertyOptional({ example: '2026-07-01', description: 'Defaults to the first day of the current month.' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-07-31', description: 'Defaults to today.' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
