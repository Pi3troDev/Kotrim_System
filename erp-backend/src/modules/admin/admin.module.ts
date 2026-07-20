import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { LegalModule } from '../legal/legal.module';
import { AdminController } from './admin.controller';
import { JwtModule } from '@nestjs/jwt';
import { AdminService } from './admin.service';
import { ImpersonationService } from './impersonation.service';
import { MetricsService } from './metrics.service';
import { HealthService } from './health.service';
import { ImpersonationController } from './impersonation.controller';

@Module({
  imports: [BillingModule, LegalModule, JwtModule.register({})],
  controllers: [AdminController, ImpersonationController],
  providers: [AdminService, ImpersonationService, MetricsService, HealthService],
})
export class AdminModule {}
