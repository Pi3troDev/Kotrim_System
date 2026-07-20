import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @ApiPropertyOptional({ description: 'Deactivating an employee stops their active payroll recurrence, if any.' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
