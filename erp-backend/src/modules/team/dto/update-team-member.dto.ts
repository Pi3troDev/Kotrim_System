import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTeamMemberDto {
  @ApiPropertyOptional({ description: 'Deactivate or reactivate this login.' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
