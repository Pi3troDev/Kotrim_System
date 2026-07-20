import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { MailStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { MailTemplateKey } from '../../mail/templates/template.types';

export class QueryMailLogsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MailStatus })
  @IsOptional()
  @IsEnum(MailStatus)
  status?: MailStatus;

  @ApiPropertyOptional({ enum: MailTemplateKey })
  @IsOptional()
  @IsEnum(MailTemplateKey)
  template?: MailTemplateKey;
}
