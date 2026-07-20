import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecurrenceFrequency } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Conta de energia elétrica' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  description: string;

  @ApiProperty({ example: 450.9, description: 'Total amount — when `installments` is set, this is split across the installments.' })
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

  @ApiPropertyOptional({ description: 'Expected account this will be paid from — a UI convenience, never used for balance math.' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Employee this expense originates from — e.g. a payroll entry.' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

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
