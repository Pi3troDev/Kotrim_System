import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { IsCpfOrCnpj } from '../../../common/validators/cpf-cnpj.validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateCompanySettingsDto {
  @ApiPropertyOptional({ example: 'Oficina do João' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: '12.345.678/0001-99' })
  @IsOptional()
  @IsString()
  @IsCpfOrCnpj()
  document?: string;

  @ApiPropertyOptional({ example: 'contato@oficina.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '(11) 91234-5678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  zipCode?: string;

  @ApiPropertyOptional({ example: '08:00', description: 'Horário de abertura (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'businessHoursStart deve estar no formato HH:mm' })
  businessHoursStart?: string;

  @ApiPropertyOptional({ example: '18:00', description: 'Horário de fechamento (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'businessHoursEnd deve estar no formato HH:mm' })
  businessHoursEnd?: string;

  @ApiPropertyOptional({ example: [1, 2, 3, 4, 5], description: 'Dias úteis (0=domingo ... 6=sábado)' })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  workDays?: number[];
}
