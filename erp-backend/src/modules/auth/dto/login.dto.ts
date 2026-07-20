import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'joao@oficina.com' })
  @IsEmail()
  email: string;

  /**
   * Stays at 8 while new passwords require 10 (see IsStrongPassword).
   *
   * Login validates a password that already exists; tightening it here would
   * lock out every account created before the rule changed — turning a policy
   * update into an outage. The floor exists only to reject obviously empty
   * input before it reaches bcrypt.
   */
  @ApiProperty({ example: 'Str0ngP@ssword!' })
  @IsString()
  @MinLength(8)
  password: string;
}
