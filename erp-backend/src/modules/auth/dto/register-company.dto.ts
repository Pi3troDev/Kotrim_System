import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterCompanyDto {
  @ApiProperty({ example: 'Oficina do João' })
  @IsString()
  @MinLength(2)
  companyName: string;

  @ApiProperty({ example: '12345678000199' })
  @IsString()
  @MinLength(11)
  companyDocument: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(2)
  adminName: string;

  @ApiProperty({ example: 'joao@oficina.com' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: 'Str0ngP@ssword!', minLength: 8 })
  @IsString()
  @MinLength(8)
  adminPassword: string;
}
