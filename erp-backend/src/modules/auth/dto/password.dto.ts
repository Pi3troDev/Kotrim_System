import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/strong-password.validator';

export class ValidatePasswordTokenDto {
  @ApiProperty()
  @IsString()
  token: string;
}

export class SetPasswordDto {
  @ApiProperty({ description: 'The single-use token from the setup/reset link' })
  @IsString()
  token: string;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @IsStrongPassword()
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;
}
