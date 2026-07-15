import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedSession } from './interfaces/auth-tokens.interface';
export declare class AuthController {
    private readonly authService;
    private readonly configService;
    constructor(authService: AuthService, configService: ConfigService);
    registerCompany(dto: RegisterCompanyDto, res: Response): Promise<AuthenticatedSession>;
    login(dto: LoginDto, res: Response): Promise<AuthenticatedSession>;
    refresh(req: Request, res: Response): Promise<AuthenticatedSession>;
    logout(req: Request, res: Response): Promise<void>;
    private setRefreshCookie;
}
