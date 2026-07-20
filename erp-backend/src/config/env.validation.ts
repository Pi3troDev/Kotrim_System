import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(1)
  PORT: number = 3000;

  @IsString()
  API_PREFIX: string = 'api/v1';

  @IsString()
  CORS_ORIGIN: string;

  // Falls back to CORS_ORIGIN when unset — in every environment so far they are
  // the same host, and a wrong link in an e-mail is worse than a duplicate var.
  @IsString()
  @IsOptional()
  APP_URL?: string;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET: string;

  @IsString()
  JWT_ACCESS_EXPIRES_IN: string = '15m';

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @IsInt()
  @Min(1)
  TRIAL_DURATION_DAYS: number = 7;

  // Billing contact details are optional: an empty value degrades the manual
  // payment instructions to "contact the administrator", it does not stop boot.
  // Mail. All optional: with none of these set the app boots on the console
  // provider and logs messages instead of sending them, which is exactly what a
  // fresh clone should do.
  @IsString()
  @IsOptional()
  MAIL_PROVIDER?: string;

  @IsString()
  @IsOptional()
  RESEND_API_KEY?: string;

  @IsString()
  @IsOptional()
  MAIL_FROM?: string;

  @IsString()
  @IsOptional()
  MAIL_REDIRECT_TO?: string;

  @IsString()
  @IsOptional()
  MAIL_STAFF_NOTIFY_TO?: string;

  @IsString()
  BILLING_PIX_KEY: string = '';

  @IsString()
  BILLING_CONTACT: string = '';
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }

  return validatedConfig;
}
