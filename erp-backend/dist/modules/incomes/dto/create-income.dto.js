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
exports.CreateIncomeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CreateIncomeDto {
    description;
    amount;
    dueDate;
    paymentMethod;
    categoryId;
    clientId;
    workOrderId;
    accountId;
    installments;
    recurrenceFrequency;
    recurrenceEndDate;
}
exports.CreateIncomeDto = CreateIncomeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Serviço de revisão — OS #124' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateIncomeDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 350, description: 'Total amount — when `installments` is set, this is split across the installments.' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    (0, class_validator_1.Max)(100000000),
    __metadata("design:type", Number)
], CreateIncomeDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-10', description: 'Due date of the first (or only) installment.' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateIncomeDto.prototype, "dueDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'PIX' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateIncomeDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateIncomeDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateIncomeDto.prototype, "clientId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateIncomeDto.prototype, "workOrderId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Expected account this will be received into — a UI convenience, never used for balance math.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateIncomeDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 3, minimum: 2, maximum: 24, description: 'Splits amount into this many monthly installments. Mutually exclusive with recurrenceFrequency.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2),
    (0, class_validator_1.Max)(24),
    __metadata("design:type", Number)
], CreateIncomeDto.prototype, "installments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.RecurrenceFrequency, description: 'Marks this as the first occurrence of a recurring series. Mutually exclusive with installments.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.RecurrenceFrequency),
    __metadata("design:type", String)
], CreateIncomeDto.prototype, "recurrenceFrequency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2027-01-01', description: 'Last date the recurrence should generate an occurrence for. Omit for an indefinite series.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateIncomeDto.prototype, "recurrenceEndDate", void 0);
//# sourceMappingURL=create-income.dto.js.map