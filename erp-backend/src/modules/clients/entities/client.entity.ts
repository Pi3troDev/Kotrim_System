import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClientEntity {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() document?: string | null;
  @ApiPropertyOptional() email?: string | null;
  @ApiPropertyOptional() phone?: string | null;
  @ApiPropertyOptional() address?: string | null;
  @ApiPropertyOptional() city?: string | null;
  @ApiPropertyOptional() state?: string | null;
  @ApiPropertyOptional() zipCode?: string | null;
  @ApiPropertyOptional() notes?: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
