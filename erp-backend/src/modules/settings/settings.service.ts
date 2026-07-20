import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Company } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { imageUploadOptions, persistImage, publicUploadPath } from '../../common/utils/image-upload.util';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

export const COMPANY_LOGO_UPLOAD_OPTIONS = imageUploadOptions();

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompany(companyId: string): Promise<Company> {
    return this.findCompanyOrThrow(companyId);
  }

  async updateCompany(companyId: string, dto: UpdateCompanySettingsDto): Promise<Company> {
    await this.findCompanyOrThrow(companyId);

    if (dto.document) {
      await this.assertDocumentIsUnique(companyId, dto.document);
    }

    return this.prisma.company.update({ where: { id: companyId }, data: dto });
  }

  async updateLogo(companyId: string, file: Express.Multer.File): Promise<Company> {
    await this.findCompanyOrThrow(companyId);

    // persistImage inspects the bytes before anything touches disk — the
    // mimetype on the request cannot be trusted.
    const filename = await persistImage(file, 'logos');
    const logoUrl = publicUploadPath('logos', filename);

    return this.prisma.company.update({ where: { id: companyId }, data: { logoUrl } });
  }

  private async findCompanyOrThrow(companyId: string): Promise<Company> {
    const company = await this.prisma.company.findFirst({ where: { id: companyId, deletedAt: null } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  private async assertDocumentIsUnique(companyId: string, document: string): Promise<void> {
    const existing = await this.prisma.company.findUnique({ where: { document } });
    if (existing && existing.id !== companyId) {
      throw new ConflictException('A company with this document is already registered');
    }
  }
}
