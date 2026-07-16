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
exports.CreateVehicleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const CURRENT_YEAR = new Date().getFullYear();
class CreateVehicleDto {
    clientId;
    plate;
    brand;
    model;
    year;
    color;
    chassisNumber;
    mileage;
    notes;
}
exports.CreateVehicleDto = CreateVehicleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'b3f5f7a0-...' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateVehicleDto.prototype, "clientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ABC1D23' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(7),
    (0, class_validator_1.MaxLength)(8),
    __metadata("design:type", String)
], CreateVehicleDto.prototype, "plate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Volkswagen' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateVehicleDto.prototype, "brand", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Gol' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateVehicleDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2022 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1900),
    (0, class_validator_1.Max)(CURRENT_YEAR + 1),
    __metadata("design:type", Number)
], CreateVehicleDto.prototype, "year", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Prata' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateVehicleDto.prototype, "color", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '9BWZZZ377VT004251' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(17),
    __metadata("design:type", String)
], CreateVehicleDto.prototype, "chassisNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 45000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateVehicleDto.prototype, "mileage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateVehicleDto.prototype, "notes", void 0);
//# sourceMappingURL=create-vehicle.dto.js.map