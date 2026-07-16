import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    create(user: AuthenticatedUser, dto: CreateCategoryDto): Promise<{
        name: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        type: import("@prisma/client").$Enums.CategoryType;
    }>;
    findAll(user: AuthenticatedUser, query: QueryCategoriesDto): Promise<{
        name: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        type: import("@prisma/client").$Enums.CategoryType;
    }[]>;
    findOne(user: AuthenticatedUser, id: string): Promise<{
        name: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        type: import("@prisma/client").$Enums.CategoryType;
    }>;
    update(user: AuthenticatedUser, id: string, dto: UpdateCategoryDto): Promise<{
        name: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        type: import("@prisma/client").$Enums.CategoryType;
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<void>;
}
