import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import ms from 'ms';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { comparePassword, hashPassword } from '../../common/utils/password.util';
import { sha256 } from '../../common/utils/hash.util';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthTokens, AuthResult } from './interfaces/auth-tokens.interface';

const DEFAULT_ADMIN_ROLE = 'Admin';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerCompany(dto: RegisterCompanyDto): Promise<AuthResult> {
    const existing = await this.usersService.findByEmail(dto.adminEmail);
    if (existing) {
      throw new ConflictException('E-mail already in use');
    }

    const existingCompany = await this.prisma.company.findUnique({ where: { document: dto.companyDocument } });
    if (existingCompany) {
      throw new ConflictException('A company with this document is already registered');
    }

    const passwordHash = await hashPassword(dto.adminPassword);

    const { user, roleName } = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: dto.companyName, document: dto.companyDocument },
      });

      const role = await tx.role.create({
        data: {
          companyId: company.id,
          name: DEFAULT_ADMIN_ROLE,
          description: 'Full access to all company resources',
          isSystem: true,
        },
      });

      const createdUser = await tx.user.create({
        data: {
          companyId: company.id,
          roleId: role.id,
          name: dto.adminName,
          email: dto.adminEmail,
          passwordHash,
        },
      });

      return { user: createdUser, roleName: role.name };
    });

    const tokens = await this.issueTokens({
      sub: user.id,
      companyId: user.companyId,
      roleId: user.roleId,
      email: user.email,
    });

    return this.buildSession(user.id, user.name, user.email, user.companyId, roleName, tokens);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await comparePassword(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.updateLastLogin(user.id);

    const tokens = await this.issueTokens({
      sub: user.id,
      companyId: user.companyId,
      roleId: user.roleId,
      email: user.email,
    });

    return this.buildSession(user.id, user.name, user.email, user.companyId, user.role.name, tokens);
  }

  async refresh(rawRefreshToken: string): Promise<AuthResult> {
    const tokenHash = sha256(rawRefreshToken);

    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const user = await this.usersService.findById(stored.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is no longer active');
    }

    const tokens = await this.issueTokens({
      sub: user.id,
      companyId: user.companyId,
      roleId: user.roleId,
      email: user.email,
    });

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedBy: tokens.refreshTokenId },
    });

    return this.buildSession(user.id, user.name, user.email, user.companyId, user.role.name, tokens);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = sha256(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(payload: JwtPayload): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync(payload as object, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn') as ms.StringValue,
    });

    const refreshToken = randomBytes(64).toString('hex');
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn')!;

    const refreshTokenRow = await this.prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + ms(refreshExpiresIn as ms.StringValue)),
      },
    });

    return { accessToken, refreshToken, refreshTokenId: refreshTokenRow.id };
  }

  private buildSession(
    id: string,
    name: string,
    email: string,
    companyId: string,
    role: string,
    tokens: AuthTokens,
  ): AuthResult {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id, name, email, companyId, role },
    };
  }
}
