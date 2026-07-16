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
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehiclesDto } from './dto/query-vehicles.dto';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a vehicle' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(user.companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List vehicles (paginated, searchable, filterable by client)' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryVehiclesDto) {
    return this.vehiclesService.findAll(user.companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vehicle by id' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.vehiclesService.findOne(user.companyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vehicle' })
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a vehicle' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.vehiclesService.remove(user.companyId, id);
  }
}
