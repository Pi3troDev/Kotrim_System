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
exports.WorkOrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const work_orders_service_1 = require("./work-orders.service");
const create_work_order_dto_1 = require("./dto/create-work-order.dto");
const create_work_order_item_dto_1 = require("./dto/create-work-order-item.dto");
const update_work_order_dto_1 = require("./dto/update-work-order.dto");
const update_work_order_item_dto_1 = require("./dto/update-work-order-item.dto");
const update_work_order_status_dto_1 = require("./dto/update-work-order-status.dto");
const query_work_orders_dto_1 = require("./dto/query-work-orders.dto");
let WorkOrdersController = class WorkOrdersController {
    workOrdersService;
    constructor(workOrdersService) {
        this.workOrdersService = workOrdersService;
    }
    create(user, dto) {
        return this.workOrdersService.create(user.companyId, user.id, dto);
    }
    findAll(user, query) {
        return this.workOrdersService.findAll(user.companyId, query);
    }
    findOne(user, id) {
        return this.workOrdersService.findOne(user.companyId, id);
    }
    update(user, id, dto) {
        return this.workOrdersService.update(user.companyId, id, dto);
    }
    updateStatus(user, id, dto) {
        return this.workOrdersService.updateStatus(user.companyId, id, user.id, dto);
    }
    addItem(user, id, dto) {
        return this.workOrdersService.addItem(user.companyId, id, dto);
    }
    updateItem(user, id, itemId, dto) {
        return this.workOrdersService.updateItem(user.companyId, id, itemId, dto);
    }
    removeItem(user, id, itemId) {
        return this.workOrdersService.removeItem(user.companyId, id, itemId);
    }
    remove(user, id) {
        return this.workOrdersService.remove(user.companyId, id);
    }
};
exports.WorkOrdersController = WorkOrdersController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a work order' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_work_order_dto_1.CreateWorkOrderDto]),
    __metadata("design:returntype", void 0)
], WorkOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List work orders (paginated, searchable, filterable)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_work_orders_dto_1.QueryWorkOrdersDto]),
    __metadata("design:returntype", void 0)
], WorkOrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a work order by id, including items and status history' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WorkOrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a work order (problem/diagnosis/discount/warranty)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_work_order_dto_1.UpdateWorkOrderDto]),
    __metadata("design:returntype", void 0)
], WorkOrdersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Change a work order status (logs to history)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_work_order_status_dto_1.UpdateWorkOrderStatusDto]),
    __metadata("design:returntype", void 0)
], WorkOrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/items'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a service/part line item' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_work_order_item_dto_1.CreateWorkOrderItemDto]),
    __metadata("design:returntype", void 0)
], WorkOrdersController.prototype, "addItem", null);
__decorate([
    (0, common_1.Patch)(':id/items/:itemId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a service/part line item' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('itemId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_work_order_item_dto_1.UpdateWorkOrderItemDto]),
    __metadata("design:returntype", void 0)
], WorkOrdersController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Delete)(':id/items/:itemId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a service/part line item' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], WorkOrdersController.prototype, "removeItem", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete a work order' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "remove", null);
exports.WorkOrdersController = WorkOrdersController = __decorate([
    (0, swagger_1.ApiTags)('work-orders'),
    (0, common_1.Controller)('work-orders'),
    __metadata("design:paramtypes", [work_orders_service_1.WorkOrdersService])
], WorkOrdersController);
//# sourceMappingURL=work-orders.controller.js.map