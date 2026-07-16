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
exports.AccountsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const accounts_service_1 = require("./accounts.service");
const create_account_dto_1 = require("./dto/create-account.dto");
const update_account_dto_1 = require("./dto/update-account.dto");
let AccountsController = class AccountsController {
    accountsService;
    constructor(accountsService) {
        this.accountsService = accountsService;
    }
    create(user, dto) {
        return this.accountsService.create(user.companyId, dto);
    }
    findAll(user) {
        return this.accountsService.findAll(user.companyId);
    }
    findOne(user, id) {
        return this.accountsService.findOne(user.companyId, id);
    }
    update(user, id, dto) {
        return this.accountsService.update(user.companyId, id, dto);
    }
    remove(user, id) {
        return this.accountsService.remove(user.companyId, id);
    }
};
exports.AccountsController = AccountsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create an account (bank/cash/wallet/etc)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_account_dto_1.CreateAccountDto]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List accounts with their computed current balance' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get an account by id' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an account' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_account_dto_1.UpdateAccountDto]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete an account' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "remove", null);
exports.AccountsController = AccountsController = __decorate([
    (0, swagger_1.ApiTags)('accounts'),
    (0, common_1.Controller)('accounts'),
    __metadata("design:paramtypes", [accounts_service_1.AccountsService])
], AccountsController);
//# sourceMappingURL=accounts.controller.js.map