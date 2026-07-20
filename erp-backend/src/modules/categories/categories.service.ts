import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Category, CategoryType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CATEGORY_TYPE_FEATURE, PlanFeature } from '../billing/plan-features';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';

/**
 * Categories are the one module that cannot be gated by route: the same
 * endpoints serve stock categories (which follow INVENTORY) and expense/income
 * ones (which follow FINANCE). A blanket `@RequiresFeature` would break whichever
 * of the two the plan legitimately has, so every method takes the caller's
 * feature list and filters by category type instead.
 */
@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateCategoryDto, features: PlanFeature[]): Promise<Category> {
    this.assertTypeIsAllowed(dto.type, features);
    await this.assertNameIsUnique(companyId, dto.name, dto.type);

    return this.prisma.category.create({ data: { ...dto, companyId } });
  }

  async findAll(companyId: string, query: QueryCategoriesDto, features: PlanFeature[]): Promise<Category[]> {
    const allowedTypes = this.allowedTypes(features);

    // An explicit ?type= the plan does not own returns empty rather than 403:
    // this is a list endpoint, and "no categories" is the honest answer for a
    // module the company does not have.
    const typeFilter = query.type
      ? allowedTypes.includes(query.type)
        ? [query.type]
        : []
      : allowedTypes;

    const where: Prisma.CategoryWhereInput = {
      companyId,
      deletedAt: null,
      type: { in: typeFilter },
    };

    return this.prisma.category.findMany({ where, orderBy: { name: 'asc' } });
  }

  async findOne(companyId: string, id: string, features: PlanFeature[]): Promise<Category> {
    const category = await this.prisma.category.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    this.assertTypeIsAllowed(category.type, features);
    return category;
  }

  private allowedTypes(features: PlanFeature[]): CategoryType[] {
    return Object.values(CategoryType).filter((type) => features.includes(CATEGORY_TYPE_FEATURE[type]));
  }

  private assertTypeIsAllowed(type: CategoryType, features: PlanFeature[]): void {
    const required = CATEGORY_TYPE_FEATURE[type];
    if (features.includes(required)) {
      return;
    }

    throw new ForbiddenException({
      statusCode: 403,
      error: 'PLAN_UPGRADE_REQUIRED',
      feature: required,
      message: 'Este módulo não está incluído no seu plano. Faça upgrade para liberar o acesso.',
    });
  }

  async update(companyId: string, id: string, dto: UpdateCategoryDto, features: PlanFeature[]): Promise<Category> {
    // findOne already enforces the type against the plan.
    const existing = await this.findOne(companyId, id, features);

    if (dto.name) {
      await this.assertNameIsUnique(companyId, dto.name, existing.type, id);
    }

    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(companyId: string, id: string, features: PlanFeature[]): Promise<void> {
    await this.findOne(companyId, id, features);
    await this.prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async assertNameIsUnique(
    companyId: string,
    name: string,
    type: Category['type'],
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prisma.category.findFirst({
      where: { companyId, name, type, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
    });

    if (existing) {
      throw new ConflictException('A category with this name already exists');
    }
  }
}
