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
exports.CreateWorkOrderItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CreateWorkOrderItemDto {
    type;
    description;
    quantity;
    unitPrice;
}
exports.CreateWorkOrderItemDto = CreateWorkOrderItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.WorkOrderItemType, example: client_1.WorkOrderItemType.SERVICE }),
    (0, class_validator_1.IsEnum)(client_1.WorkOrderItemType),
    __metadata("design:type", String)
], CreateWorkOrderItemDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Troca de óleo e filtro' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateWorkOrderItemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    (0, class_validator_1.Max)(100000),
    __metadata("design:type", Number)
], CreateWorkOrderItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 150 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateWorkOrderItemDto.prototype, "unitPrice", void 0);
//# sourceMappingURL=create-work-order-item.dto.js.map