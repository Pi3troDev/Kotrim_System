import { Category } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
export declare class CategoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(companyId: string, dto: CreateCategoryDto): Promise<Category>;
    findAll(companyId: string, query: QueryCategoriesDto): Promise<Category[]>;
    findOne(companyId: string, id: string): Promise<Category>;
    update(companyId: string, id: string, dto: UpdateCategoryDto): Promise<Category>;
    remove(companyId: string, id: string): Promise<void>;
    private assertNameIsUnique;
}
