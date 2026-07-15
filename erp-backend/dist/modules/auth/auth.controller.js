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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const ms_1 = __importDefault(require("ms"));
const public_decorator_1 = require("../../common/decorators/public.decorator");
const auth_service_1 = require("./auth.service");
const register_company_dto_1 = require("./dto/register-company.dto");
const login_dto_1 = require("./dto/login.dto");
const REFRESH_COOKIE_NAME = 'refresh_token';
let AuthController = class AuthController {
    authService;
    configService;
    constructor(authService, configService) {
        this.authService = authService;
        this.configService = configService;
    }
    async registerCompany(dto, res) {
        const { refreshToken, ...session } = await this.authService.registerCompany(dto);
        this.setRefreshCookie(res, refreshToken);
        return session;
    }
    async login(dto, res) {
        const { refreshToken, ...session } = await this.authService.login(dto);
        this.setRefreshCookie(res, refreshToken);
        return session;
    }
    async refresh(req, res) {
        const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
        if (!rawRefreshToken) {
            throw new common_1.UnauthorizedException('Missing refresh token');
        }
        const { refreshToken, ...session } = await this.authService.refresh(rawRefreshToken);
        this.setRefreshCookie(res, refreshToken);
        return session;
    }
    async logout(req, res) {
        const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
        if (rawRefreshToken) {
            await this.authService.logout(rawRefreshToken);
        }
        res.clearCookie(REFRESH_COOKIE_NAME);
    }
    setRefreshCookie(res, refreshToken) {
        const refreshExpiresIn = this.configService.get('jwt.refreshExpiresIn');
        const isProduction = this.configService.get('env') === 'production';
        const apiPrefix = this.configService.get('apiPrefix');
        res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            path: `/${apiPrefix}/auth`,
            maxAge: (0, ms_1.default)(refreshExpiresIn),
        });
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register-company'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new company and its administrator user' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_company_dto_1.RegisterCompanyDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerCompany", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Authenticate with email and password' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Rotate the refresh token cookie and issue a new access token' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke the current refresh token' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map