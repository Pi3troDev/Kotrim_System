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
exports.UpdateWorkOrderStatusDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class UpdateWorkOrderStatusDto {
    status;
    notes;
}
exports.UpdateWorkOrderStatusDto = UpdateWorkOrderStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.WorkOrderStatus, example: client_1.WorkOrderStatus.IN_PROGRESS }),
    (0, class_validator_1.IsEnum)(client_1.WorkOrderStatus),
    __metadata("design:type", String)
], UpdateWorkOrderStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Cliente aprovou o orçamento por telefone.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateWorkOrderStatusDto.prototype, "notes", void 0);
//# sourceMappingURL=update-work-order-status.dto.js.map