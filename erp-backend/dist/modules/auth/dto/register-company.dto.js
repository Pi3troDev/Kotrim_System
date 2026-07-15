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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterCompanyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RegisterCompanyDto {
    companyName;
    companyDocument;
    adminName;
    adminEmail;
    adminPassword;
}
exports.RegisterCompanyDto = RegisterCompanyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Oficina do João' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], RegisterCompanyDto.prototype, "companyName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '12345678000199' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(11),
    __metadata("design:type", String)
], RegisterCompanyDto.prototype, "companyDocument", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'João Silva' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], RegisterCompanyDto.prototype, "adminName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'joao@oficina.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterCompanyDto.prototype, "adminEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Str0ngP@ssword!', minLength: 8 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], RegisterCompanyDto.prototype, "adminPassword", void 0);
//# sourceMappingURL=register-company.dto.js.map