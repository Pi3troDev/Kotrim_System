import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { SuperAdminGuard } from './common/guards/super-admin.guard';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { PlanFeatureGuard } from './common/guards/plan-feature.guard';
import { ImpersonationReadOnlyGuard } from './common/guards/impersonation-readonly.guard';
// import { LegalAcceptanceGuard } from './common/guards/legal-acceptance.guard'; // postponed, see providers below
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ClientsModule } from './modules/clients/clients.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { IncomesModule } from './modules/incomes/incomes.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { ScheduledTasksModule } from './modules/scheduled-tasks/scheduled-tasks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { MailModule } from './modules/mail/mail.module';
import { AuditModule } from './modules/audit/audit.module';
import { BillingModule } from './modules/billing/billing.module';
import { AdminModule } from './modules/admin/admin.module';
import { LegalModule } from './modules/legal/legal.module';
import { TeamModule } from './modules/team/team.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // First match wins. `.env` is the last resort and points at the
      // development branch on purpose, so a missing NODE_ENV lands somewhere
      // safe to wipe rather than on production.
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      load: [configuration],
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        autoLogging: true,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
          limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
        },
      ],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    MailModule,
    AuditModule,
    AuthModule,
    UsersModule,
    TeamModule,
    DashboardModule,
    ClientsModule,
    VehiclesModule,
    WorkOrdersModule,
    CategoriesModule,
    SuppliersModule,
    InventoryModule,
    ExpensesModule,
    IncomesModule,
    AccountsModule,
    ScheduledTasksModule,
    NotificationsModule,
    EmployeesModule,
    AppointmentsModule,
    ReportsModule,
    SettingsModule,
    BillingModule,
    AdminModule,
    LegalModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Order matters: JwtAuthGuard populates request.user, which the three
    // guards after it all read.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: SuperAdminGuard },
    // Right after the identity guards: a support session must be stopped before
    // any module-level rule gets a chance to let a write through.
    { provide: APP_GUARD, useClass: ImpersonationReadOnlyGuard },
    // LGPD phase postponed (2026-07-17): re-enable once the frontend actually
    // catches LEGAL_ACCEPTANCE_REQUIRED and shows LegalAcceptanceDialog.
    // Left active, this walls off every existing user with no way to recover
    // in the UI, since nobody has an acceptance row for the newly-seeded
    // documents and nothing opens the dialog yet.
    // { provide: APP_GUARD, useClass: LegalAcceptanceGuard },
    { provide: APP_GUARD, useClass: SubscriptionGuard },
    // After SubscriptionGuard, which caches the resolved subscription on the
    // request for this one to reuse.
    { provide: APP_GUARD, useClass: PlanFeatureGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
