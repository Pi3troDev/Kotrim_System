import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Equals, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/strong-password.validator';

/**
 * How the company signed up. This is the whole difference between the two
 * funnels the landing page offers.
 */
export enum RegistrationIntent {
  /** "Começar teste grátis" — 7-day TRIAL, straight into the ERP. */
  TRIAL = 'TRIAL',
  /** "Assinar agora" — no trial; PENDING until a payment is confirmed. */
  SUBSCRIBE = 'SUBSCRIBE',
}

export class RegisterCompanyDto {
  @ApiPropertyOptional({
    enum: RegistrationIntent,
    default: RegistrationIntent.TRIAL,
    description: 'TRIAL starts the free trial; SUBSCRIBE creates a PENDING subscription with no trial.',
  })
  @IsOptional()
  @IsEnum(RegistrationIntent)
  intent?: RegistrationIntent = RegistrationIntent.TRIAL;

  @ApiPropertyOptional({ description: 'Plan slug chosen on the pricing page. Only meaningful with intent=SUBSCRIBE.' })
  @IsOptional()
  @IsString()
  planSlug?: string;

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

  @ApiProperty({
    description: 'Must be true. Confirms the signer read the current Terms of Use and Privacy Policy.',
  })
  @Equals(true, { message: 'É necessário aceitar os Termos de Uso e a Política de Privacidade para continuar.' })
  acceptedTerms: boolean;
}
