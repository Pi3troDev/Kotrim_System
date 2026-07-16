import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { CreateWorkOrderItemDto } from './dto/create-work-order-item.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { UpdateWorkOrderItemDto } from './dto/update-work-order-item.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { QueryWorkOrdersDto } from './dto/query-work-orders.dto';

@ApiTags('work-orders')
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a work order' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWorkOrderDto) {
    return this.workOrdersService.create(user.companyId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List work orders (paginated, searchable, filterable)' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryWorkOrdersDto) {
    return this.workOrdersService.findAll(user.companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a work order by id, including items and status history' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.workOrdersService.findOne(user.companyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a work order (problem/diagnosis/discount/warranty)' })
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.workOrdersService.update(user.companyId, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change a work order status (logs to history)' })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderStatusDto,
  ) {
    return this.workOrdersService.updateStatus(user.companyId, id, user.id, dto);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add a service/part line item' })
  addItem(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreateWorkOrderItemDto) {
    return this.workOrdersService.addItem(user.companyId, id, dto);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Update a service/part line item' })
  updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateWorkOrderItemDto,
  ) {
    return this.workOrdersService.updateItem(user.companyId, id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Remove a service/part line item' })
  removeItem(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.workOrdersService.removeItem(user.companyId, id, itemId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a work order' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.workOrdersService.remove(user.companyId, id);
  }
}
