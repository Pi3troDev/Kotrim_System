import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { IsCpfOrCnpj } from '../../../common/validators/cpf-cnpj.validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Carlos Mendes' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: '123.456.789-09' })
  @IsOptional()
  @IsString()
  @IsCpfOrCnpj()
  document?: string;

  @ApiPropertyOptional({ example: 'Mecânico' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({ example: 'Motores a diesel' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  specialty?: string;

  @ApiPropertyOptional({ example: '(11) 91234-5678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'carlos@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsOptional()
  @IsDateString()
  hiredAt?: string;

  @ApiPropertyOptional({ example: 2500, description: 'Monthly salary. When set, a recurring monthly payroll expense is created in Financeiro.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000000)
  salary?: number;
}
