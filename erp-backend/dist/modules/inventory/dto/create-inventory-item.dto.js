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
exports.CreateInventoryItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateInventoryItemDto {
    name;
    sku;
    description;
    unit;
    costPrice;
    salePrice;
    minimumStock;
    initialQuantity;
    location;
    categoryId;
    supplierId;
}
exports.CreateInventoryItemDto = CreateInventoryItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Óleo de motor 5W30 (1L)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateInventoryItemDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'OL-5W30-1L' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateInventoryItemDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateInventoryItemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'UN', default: 'UN' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], CreateInventoryItemDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 25, default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateInventoryItemDto.prototype, "costPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 45, default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateInventoryItemDto.prototype, "salePrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5, default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateInventoryItemDto.prototype, "minimumStock", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Stock quantity to seed on creation (logged as an initial IN movement)', example: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1000000),
    __metadata("design:type", Number)
], CreateInventoryItemDto.prototype, "initialQuantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateInventoryItemDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateInventoryItemDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateInventoryItemDto.prototype, "supplierId", void 0);
//# sourceMappingURL=create-inventory-item.dto.js.map