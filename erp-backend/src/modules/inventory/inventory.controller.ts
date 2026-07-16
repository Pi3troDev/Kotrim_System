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
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { QueryInventoryItemsDto } from './dto/query-inventory-items.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create an inventory item' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(user.companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List inventory items (paginated, searchable, filterable)' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryInventoryItemsDto) {
    return this.inventoryService.findAll(user.companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an inventory item by id' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.inventoryService.findOne(user.companyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an inventory item (never changes quantityInStock)' })
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.inventoryService.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an inventory item' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.inventoryService.remove(user.companyId, id);
  }

  @Post(':id/movements')
  @ApiOperation({ summary: 'Record a stock movement (IN/OUT/ADJUSTMENT) and update the balance' })
  createMovement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateStockMovementDto,
  ) {
    return this.inventoryService.createMovement(user.companyId, id, user.id, dto);
  }

  @Get(':id/movements')
  @ApiOperation({ summary: 'List the most recent stock movements for an item' })
  listMovements(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.inventoryService.listMovements(user.companyId, id);
  }
}
