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
exports.CreateSupplierDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const cpf_cnpj_validator_1 = require("../../../common/validators/cpf-cnpj.validator");
class CreateSupplierDto {
    name;
    document;
    email;
    phone;
    address;
    notes;
}
exports.CreateSupplierDto = CreateSupplierDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Auto Peças Silva Ltda' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '12.345.678/0001-90' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, cpf_cnpj_validator_1.IsCpfOrCnpj)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "document", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'contato@fornecedor.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '(11) 91234-5678' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "notes", void 0);
//# sourceMappingURL=create-supplier.dto.js.map