import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { LegalDocumentType } from '@prisma/client';

export class PublishLegalDocumentDto {
  @ApiProperty({ enum: LegalDocumentType })
  @IsEnum(LegalDocumentType)
  type: LegalDocumentType;

  @ApiProperty({ example: '2026-08-01', description: 'A date-stamped label, shown to users on re-acceptance.' })
  @IsString()
  @MinLength(1)
  version: string;

  @ApiProperty({ example: 'Termos de Uso' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ description: 'Pre-authored HTML. Rendered as-is on the public /termos and /privacidade pages.' })
  @IsString()
  @MinLength(1)
  content: string;
}
