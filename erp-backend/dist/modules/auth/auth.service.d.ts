import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResult } from './interfaces/auth-tokens.interface';
export declare class AuthService {
    private readonly prisma;
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    constructor(prisma: PrismaService, usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    registerCompany(dto: RegisterCompanyDto): Promise<AuthResult>;
    login(dto: LoginDto): Promise<AuthResult>;
    refresh(rawRefreshToken: string): Promise<AuthResult>;
    logout(rawRefreshToken: string): Promise<void>;
    private issueTokens;
    private buildSession;
}
