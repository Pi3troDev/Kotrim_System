import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { LegalController } from './legal.controller';
import { LegalDocumentService } from './legal-document.service';
import { LegalAcceptanceService } from './legal-acceptance.service';
import { DataExportService } from './data-export.service';
import { DataAnonymizationService } from './data-anonymization.service';

@Module({
  imports: [AuditModule],
  controllers: [LegalController],
  providers: [LegalDocumentService, LegalAcceptanceService, DataExportService, DataAnonymizationService],
  exports: [LegalDocumentService, LegalAcceptanceService, DataExportService, DataAnonymizationService],
})
export class LegalModule {}
