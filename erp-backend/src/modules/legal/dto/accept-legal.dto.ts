import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class AcceptLegalDto {
  @ApiProperty({ type: [String], description: 'IDs of the LegalDocument versions being accepted.' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  documentIds: string[];
}
