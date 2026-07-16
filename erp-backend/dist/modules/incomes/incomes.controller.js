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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const incomes_service_1 = require("./incomes.service");
const create_income_dto_1 = require("./dto/create-income.dto");
const update_income_dto_1 = require("./dto/update-income.dto");
const update_income_status_dto_1 = require("./dto/update-income-status.dto");
const query_incomes_dto_1 = require("./dto/query-incomes.dto");
const create_payment_dto_1 = require("./dto/create-payment.dto");
let IncomesController = class IncomesController {
    incomesService;
    constructor(incomesService) {
        this.incomesService = incomesService;
    }
    create(user, dto) {
        return this.incomesService.create(user.companyId, dto);
    }
    findAll(user, query) {
        return this.incomesService.findAll(user.companyId, query);
    }
    summary(user) {
        return this.incomesService.summary(user.companyId);
    }
    findOne(user, id) {
        return this.incomesService.findOne(user.companyId, id);
    }
    update(user, id, dto) {
        return this.incomesService.update(user.companyId, id, dto);
    }
    updateStatus(user, id, dto) {
        return this.incomesService.updateStatus(user.companyId, id, dto);
    }
    stopRecurrence(user, id) {
        return this.incomesService.stopRecurrence(user.companyId, id);
    }
    addPayment(user, id, dto) {
        return this.incomesService.addPayment(user.companyId, id, dto);
    }
    listPayments(user, id) {
        return this.incomesService.listPayments(user.companyId, id);
    }
    removePayment(user, id, paymentId) {
        return this.incomesService.removePayment(user.companyId, id, paymentId);
    }
    remove(user, id) {
        return this.incomesService.remove(user.companyId, id);
    }
};
exports.IncomesController = IncomesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create an income (optionally split into installments) — always returns an array' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_income_dto_1.CreateIncomeDto]),
    __metadata("design:returntype", void 0)
], IncomesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List incomes (paginated, searchable, filterable)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_incomes_dto_1.QueryIncomesDto]),
    __metadata("design:returntype", void 0)
], IncomesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Aggregate totals for the incomes KPI strip' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IncomesController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get an income by id' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], IncomesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an income' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_income_dto_1.UpdateIncomeDto]),
    __metadata("design:returntype", void 0)
], IncomesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark an income as pending or cancelled' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_income_status_dto_1.UpdateIncomeStatusDto]),
    __metadata("design:returntype", void 0)
], IncomesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/stop-recurrence'),
    (0, swagger_1.ApiOperation)({ summary: 'Stop future occurrences of a recurring income series' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IncomesController.prototype, "stopRecurrence", null);
__decorate([
    (0, common_1.Post)(':id/payments'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a (partial or full) payment against an income' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_payment_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", void 0)
], IncomesController.prototype, "addPayment", null);
__decorate([
    (0, common_1.Get)(':id/payments'),
    (0, swagger_1.ApiOperation)({ summary: 'List payments registered against an income' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], IncomesController.prototype, "listPayments", null);
__decorate([
    (0, common_1.Delete)(':id/payments/:paymentId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a payment (adjusts the income balance/status back)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('paymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], IncomesController.prototype, "removePayment", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete an income' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IncomesController.prototype, "remove", null);
exports.IncomesController = IncomesController = __decorate([
    (0, swagger_1.ApiTags)('incomes'),
    (0, common_1.Controller)('incomes'),
    __metadata("design:paramtypes", [incomes_service_1.IncomesService])
], IncomesController);
//# sourceMappingURL=incomes.controller.js.map