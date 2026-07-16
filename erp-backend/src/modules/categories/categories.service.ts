import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateCategoryDto): Promise<Category> {
    await this.assertNameIsUnique(companyId, dto.name, dto.type);

    return this.prisma.category.create({ data: { ...dto, companyId } });
  }

  async findAll(companyId: string, query: QueryCategoriesDto): Promise<Category[]> {
    const where: Prisma.CategoryWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.type && { type: query.type }),
    };

    return this.prisma.category.findMany({ where, orderBy: { name: 'asc' } });
  }

  async findOne(companyId: string, id: string): Promise<Category> {
    const category = await this.prisma.category.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async update(companyId: string, id: string, dto: UpdateCategoryDto): Promise<Category> {
    const existing = await this.findOne(companyId, id);

    if (dto.name) {
      await this.assertNameIsUnique(companyId, dto.name, existing.type, id);
    }

    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.findOne(companyId, id);
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
