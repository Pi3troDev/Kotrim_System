import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { Cargo } from '../cargo';

export class InviteTeamMemberDto {
  @ApiProperty({ example: 'Carlos Mendes' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'carlos@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: Cargo, example: Cargo.MECANICO })
  @IsEnum(Cargo)
  cargo: Cargo;
}
