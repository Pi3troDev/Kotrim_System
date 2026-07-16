import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(user.companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List categories, optionally filtered by type' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryCategoriesDto) {
    return this.categoriesService.findAll(user.companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by id' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.categoriesService.findOne(user.companyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a category' })
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a category' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.categoriesService.remove(user.companyId, id);
  }
}
