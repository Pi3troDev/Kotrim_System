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
exports.CreateWorkOrderDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const create_work_order_item_dto_1 = require("./create-work-order-item.dto");
class CreateWorkOrderDto {
    clientId;
    vehicleId;
    reportedProblem;
    diagnosis;
    observations;
    discountAmount;
    warrantyDays;
    items;
}
exports.CreateWorkOrderDto = CreateWorkOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'b3f5f7a0-...' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "clientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'b3f5f7a0-...' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "vehicleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Barulho estranho ao frear' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "reportedProblem", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "diagnosis", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "observations", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateWorkOrderDto.prototype, "discountAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 90 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(3650),
    __metadata("design:type", Number)
], CreateWorkOrderDto.prototype, "warrantyDays", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [create_work_order_item_dto_1.CreateWorkOrderItemDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => create_work_order_item_dto_1.CreateWorkOrderItemDto),
    __metadata("design:type", Array)
], CreateWorkOrderDto.prototype, "items", void 0);
//# sourceMappingURL=create-work-order.dto.js.map