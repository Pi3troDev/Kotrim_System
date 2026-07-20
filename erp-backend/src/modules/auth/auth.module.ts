import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { LegalModule } from '../legal/legal.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordTokenService } from './password-token.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({}), UsersModule, LegalModule],
  controllers: [AuthController],
  providers: [AuthService, PasswordTokenService, JwtStrategy],
  // Exported so scripts/init-super-admin.ts can issue a SETUP token through the
  // same code path the API uses, instead of reimplementing token hashing.
  exports: [PasswordTokenService],
})
export class AuthModule {}
