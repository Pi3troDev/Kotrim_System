import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VehicleEntity {
  @ApiProperty() id: string;
  @ApiProperty() clientId: string;
  @ApiProperty() plate: string;
  @ApiProperty() brand: string;
  @ApiProperty() model: string;
  @ApiPropertyOptional() year?: number | null;
  @ApiPropertyOptional() color?: string | null;
  @ApiPropertyOptional() chassisNumber?: string | null;
  @ApiPropertyOptional() mileage?: number | null;
  @ApiPropertyOptional() notes?: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
