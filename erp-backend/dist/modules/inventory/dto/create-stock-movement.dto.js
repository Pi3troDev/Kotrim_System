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
exports.CreateStockMovementDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CreateStockMovementDto {
    type;
    quantity;
    reason;
}
exports.CreateStockMovementDto = CreateStockMovementDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.StockMovementType, example: client_1.StockMovementType.IN }),
    (0, class_validator_1.IsEnum)(client_1.StockMovementType),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 10,
        description: 'For IN/OUT this is the delta moved; for ADJUSTMENT this is the new absolute quantity.',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1000000),
    __metadata("design:type", Number)
], CreateStockMovementDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Compra de reposição — NF 12345' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "reason", void 0);
//# sourceMappingURL=create-stock-movement.dto.js.map