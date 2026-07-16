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
exports.CreatePaymentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreatePaymentDto {
    amount;
    accountId;
    paymentMethod;
    paidAt;
    notes;
}
exports.CreatePaymentDto = CreatePaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 150 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    (0, class_validator_1.Max)(100000000),
    __metadata("design:type", Number)
], CreatePaymentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'PIX' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-05', description: 'Defaults to now.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "paidAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "notes", void 0);
//# sourceMappingURL=create-payment.dto.js.map