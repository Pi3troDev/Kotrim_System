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
exports.ExpensesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const expenses_service_1 = require("./expenses.service");
const create_expense_dto_1 = require("./dto/create-expense.dto");
const update_expense_dto_1 = require("./dto/update-expense.dto");
const update_expense_status_dto_1 = require("./dto/update-expense-status.dto");
const query_expenses_dto_1 = require("./dto/query-expenses.dto");
const create_payment_dto_1 = require("./dto/create-payment.dto");
let ExpensesController = class ExpensesController {
    expensesService;
    constructor(expensesService) {
        this.expensesService = expensesService;
    }
    create(user, dto) {
        return this.expensesService.create(user.companyId, dto);
    }
    findAll(user, query) {
        return this.expensesService.findAll(user.companyId, query);
    }
    summary(user) {
        return this.expensesService.summary(user.companyId);
    }
    findOne(user, id) {
        return this.expensesService.findOne(user.companyId, id);
    }
    update(user, id, dto) {
        return this.expensesService.update(user.companyId, id, dto);
    }
    updateStatus(user, id, dto) {
        return this.expensesService.updateStatus(user.companyId, id, dto);
    }
    stopRecurrence(user, id) {
        return this.expensesService.stopRecurrence(user.companyId, id);
    }
    addPayment(user, id, dto) {
        return this.expensesService.addPayment(user.companyId, id, dto);
    }
    listPayments(user, id) {
        return this.expensesService.listPayments(user.companyId, id);
    }
    removePayment(user, id, paymentId) {
        return this.expensesService.removePayment(user.companyId, id, paymentId);
    }
    remove(user, id) {
        return this.expensesService.remove(user.companyId, id);
    }
};
exports.ExpensesController = ExpensesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create an expense (optionally split into installments) — always returns an array' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_expense_dto_1.CreateExpenseDto]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List expenses (paginated, searchable, filterable)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_expenses_dto_1.QueryExpensesDto]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Aggregate totals for the expenses KPI strip' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get an expense by id' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an expense' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_expense_dto_1.UpdateExpenseDto]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark an expense as pending or cancelled' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_expense_status_dto_1.UpdateExpenseStatusDto]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/stop-recurrence'),
    (0, swagger_1.ApiOperation)({ summary: 'Stop future occurrences of a recurring expense series' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExpensesController.prototype, "stopRecurrence", null);
__decorate([
    (0, common_1.Post)(':id/payments'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a (partial or full) payment against an expense' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_payment_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "addPayment", null);
__decorate([
    (0, common_1.Get)(':id/payments'),
    (0, swagger_1.ApiOperation)({ summary: 'List payments registered against an expense' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "listPayments", null);
__decorate([
    (0, common_1.Delete)(':id/payments/:paymentId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a payment (adjusts the expense balance/status back)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('paymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ExpensesController.prototype, "removePayment", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete an expense' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExpensesController.prototype, "remove", null);
exports.ExpensesController = ExpensesController = __decorate([
    (0, swagger_1.ApiTags)('expenses'),
    (0, common_1.Controller)('expenses'),
    __metadata("design:paramtypes", [expenses_service_1.ExpensesService])
], ExpensesController);
//# sourceMappingURL=expenses.controller.js.map