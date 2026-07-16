import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecurrenceFrequency } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateIncomeDto {
  @ApiProperty({ example: 'Serviço de revisão — OS #124' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  description: string;

  @ApiProperty({ example: 350, description: 'Total amount — when `installments` is set, this is split across the installments.' })
  @IsNumber()
  @Min(0.01)
  @Max(100000000)
  amount: number;

  @ApiProperty({ example: '2026-08-10', description: 'Due date of the first (or only) installment.' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: 'PIX' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @ApiPropertyOptional({ description: 'Expected account this will be received into — a UI convenience, never used for balance math.' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ example: 3, minimum: 2, maximum: 24, description: 'Splits amount into this many monthly installments. Mutually exclusive with recurrenceFrequency.' })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(24)
  installments?: number;

  @ApiPropertyOptional({ enum: RecurrenceFrequency, description: 'Marks this as the first occurrence of a recurring series. Mutually exclusive with installments.' })
  @IsOptional()
  @IsEnum(RecurrenceFrequency)
  recurrenceFrequency?: RecurrenceFrequency;

  @ApiPropertyOptional({ example: '2027-01-01', description: 'Last date the recurrence should generate an occurrence for. Omit for an indefinite series.' })
  @IsOptional()
  @IsDateString()
  recurrenceEndDate?: string;
}
