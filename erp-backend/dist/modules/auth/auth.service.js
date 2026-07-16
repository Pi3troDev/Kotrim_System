"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const ms_1 = __importDefault(require("ms"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
const password_util_1 = require("../../common/utils/password.util");
const hash_util_1 = require("../../common/utils/hash.util");
const DEFAULT_ADMIN_ROLE = 'Admin';
let AuthService = class AuthService {
    prisma;
    usersService;
    jwtService;
    configService;
    constructor(prisma, usersService, jwtService, configService) {
        this.prisma = prisma;
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async registerCompany(dto) {
        const existing = await this.usersService.findByEmail(dto.adminEmail);
        if (existing) {
            throw new common_1.ConflictException('E-mail already in use');
        }
        const existingCompany = await this.prisma.company.findUnique({ where: { document: dto.companyDocument } });
        if (existingCompany) {
            throw new common_1.ConflictException('A company with this document is already registered');
        }
        const passwordHash = await (0, password_util_1.hashPassword)(dto.adminPassword);
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
    async login(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const passwordMatches = await (0, password_util_1.comparePassword)(dto.password, user.passwordHash);
        if (!passwordMatches) {
            throw new common_1.UnauthorizedException('Invalid credentials');
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
    async refresh(rawRefreshToken) {
        const tokenHash = (0, hash_util_1.sha256)(rawRefreshToken);
        const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
        if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token is invalid or expired');
        }
        const user = await this.usersService.findById(stored.userId);
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('User is no longer active');
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
    async logout(rawRefreshToken) {
        const tokenHash = (0, hash_util_1.sha256)(rawRefreshToken);
        await this.prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async issueTokens(payload) {
        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('jwt.accessSecret'),
            expiresIn: this.configService.get('jwt.accessExpiresIn'),
        });
        const refreshToken = (0, crypto_1.randomBytes)(64).toString('hex');
        const refreshExpiresIn = this.configService.get('jwt.refreshExpiresIn');
        const refreshTokenRow = await this.prisma.refreshToken.create({
            data: {
                userId: payload.sub,
                tokenHash: (0, hash_util_1.sha256)(refreshToken),
                expiresAt: new Date(Date.now() + (0, ms_1.default)(refreshExpiresIn)),
            },
        });
        return { accessToken, refreshToken, refreshTokenId: refreshTokenRow.id };
    }
    buildSession(id, name, email, companyId, role, tokens) {
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: { id, name, email, companyId, role },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map