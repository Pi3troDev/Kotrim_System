import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

/** Type is immutable after creation — create a new category instead of reclassifying one. */
export class UpdateCategoryDto extends PartialType(OmitType(CreateCategoryDto, ['type'] as const)) {}
