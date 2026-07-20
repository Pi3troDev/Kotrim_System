import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import ms from 'ms';
import { PasswordTokenPurpose } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Client } from '../../common/decorators/client-info.decorator';
import type { ClientInfo } from '../../common/decorators/client-info.decorator';
import { AuthService } from './auth.service';
import { PasswordTokenService } from './password-token.service';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, SetPasswordDto, ValidatePasswordTokenDto } from './dto/password.dto';
import { AuthenticatedSession } from './interfaces/auth-tokens.interface';

const REFRESH_COOKIE_NAME = 'refresh_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordTokenService: PasswordTokenService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register-company')
  // A signup creates a company, a user and a subscription, and sends mail.
  // Nothing legitimate needs more than a handful per minute.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a new company and its administrator user' })
  async registerCompany(
    @Body() dto: RegisterCompanyDto,
    @Res({ passthrough: true }) res: Response,
    @Client() client: ClientInfo,
  ): Promise<AuthenticatedSession> {
    const { refreshToken, ...session } = await this.authService.registerCompany(dto, client);
    this.setRefreshCookie(res, refreshToken);
    return session;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  // The global throttle is 100/min — fine for reading clients, absurd for
  // guessing a password: it would allow ~144k attempts a day from one IP.
  // Ten a minute is generous for a human and useless for a dictionary.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Authenticate with email and password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Client() client: ClientInfo,
  ): Promise<AuthenticatedSession> {
    const { refreshToken, ...session } = await this.authService.login(dto, client);
    this.setRefreshCookie(res, refreshToken);
    return session;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate the refresh token cookie and issue a new access token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthenticatedSession> {
    const rawRefreshToken = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE_NAME];
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const { refreshToken, ...session } = await this.authService.refresh(rawRefreshToken);
    this.setRefreshCookie(res, refreshToken);
    return session;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the current refresh token' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Client() client: ClientInfo,
  ): Promise<void> {
    const rawRefreshToken = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE_NAME];
    if (rawRefreshToken) {
      await this.authService.logout(rawRefreshToken, client);
    }
    res.clearCookie(REFRESH_COOKIE_NAME);
  }

  @Public()
  @Post('password/validate-setup-token')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Check whether a password setup link is still redeemable' })
  async validateSetupToken(@Body() dto: ValidatePasswordTokenDto): Promise<{ email: string; name: string }> {
    const record = await this.passwordTokenService.validate(dto.token, PasswordTokenPurpose.SETUP);
    // Safe to echo the account back: the caller already proved they hold the
    // token, so this reveals nothing they did not already have.
    return { email: record.user.email, name: record.user.name };
  }

  @Public()
  @Post('password/setup')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Set the first password for an account, using a single-use setup token' })
  async setupPassword(@Body() dto: SetPasswordDto, @Client() client: ClientInfo): Promise<{ ok: true }> {
    await this.passwordTokenService.redeem(dto.token, PasswordTokenPurpose.SETUP, dto.password, client);
    // Deliberately does NOT return a session: setting a password and logging in
    // stay separate steps, so the new password is exercised immediately.
    return { ok: true };
  }

  @Public()
  @Post('password/forgot')
  @HttpCode(HttpStatus.ACCEPTED)
  // Each call sends a real e-mail and burns the previous token. Left at 100/min
  // it doubles as a way to flood someone's inbox and to probe for accounts.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Request a password reset link',
    description:
      'Always answers 202, whether or not the address exists — otherwise this endpoint would tell an attacker which e-mails have Kotrim accounts.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Client() client: ClientInfo): Promise<{ ok: true }> {
    await this.passwordTokenService.requestReset(dto.email, client);
    return { ok: true };
  }

  @Public()
  @Post('password/validate-reset-token')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Check whether a reset link is still redeemable' })
  async validateResetToken(@Body() dto: ValidatePasswordTokenDto): Promise<{ email: string; name: string }> {
    const record = await this.passwordTokenService.validate(dto.token, PasswordTokenPurpose.RESET);
    return { email: record.user.email, name: record.user.name };
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Set a new password using a single-use reset token' })
  async resetPassword(@Body() dto: SetPasswordDto, @Client() client: ClientInfo): Promise<{ ok: true }> {
    await this.passwordTokenService.redeem(dto.token, PasswordTokenPurpose.RESET, dto.password, client);
    // No session returned: redeeming also revokes every refresh token, so the
    // user logs in with the new password. That is the point of the flow.
    return { ok: true };
  }

  private setRefreshCookie(res: Response, refreshToken: string): void {
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') as ms.StringValue;
    const isProduction = this.configService.get<string>('env') === 'production';
    const apiPrefix = this.configService.get<string>('apiPrefix');

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: `/${apiPrefix}/auth`,
      maxAge: ms(refreshExpiresIn),
    });
  }
}
