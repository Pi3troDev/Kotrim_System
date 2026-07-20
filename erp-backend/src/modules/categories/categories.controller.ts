import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlanFeatures } from '../../common/decorators/plan-features.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PlanFeature } from '../billing/plan-features';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';

/**
 * No `@RequiresFeature` on this controller: access here depends on the
 * category's *type*, not on the route. Stock categories follow INVENTORY,
 * expense/income ones follow FINANCE, and a plan can own one without the other —
 * so the service decides per record.
 */
@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCategoryDto,
    @PlanFeatures() features: PlanFeature[],
  ) {
    return this.categoriesService.create(user.companyId, dto, features);
  }

  @Get()
  @ApiOperation({ summary: 'List the categories the plan has access to, optionally filtered by type' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryCategoriesDto,
    @PlanFeatures() features: PlanFeature[],
  ) {
    return this.categoriesService.findAll(user.companyId, query, features);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by id' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @PlanFeatures() features: PlanFeature[],
  ) {
    return this.categoriesService.findOne(user.companyId, id, features);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a category' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @PlanFeatures() features: PlanFeature[],
  ) {
    return this.categoriesService.update(user.companyId, id, dto, features);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a category' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @PlanFeatures() features: PlanFeature[],
  ): Promise<void> {
    return this.categoriesService.remove(user.companyId, id, features);
  }
}
