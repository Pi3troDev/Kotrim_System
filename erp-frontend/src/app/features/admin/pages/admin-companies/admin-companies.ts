import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StatTile } from '../../../../shared/components/stat-tile/stat-tile';
import { ConfirmDialog, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { SubscriptionStatus } from '../../../subscription/interfaces/subscription.interfaces';
import { AdminService } from '../../services/admin.service';
import { AdminCompanyRow, AdminStats } from '../../interfaces/admin.interfaces';
import { ActivateSubscriptionDialog } from '../../components/activate-subscription-dialog/activate-subscription-dialog';
import { ChangeDueDateDialog } from '../../components/change-due-date-dialog/change-due-date-dialog';
import { AdminTabs } from '../../components/admin-tabs/admin-tabs';
import { ImpersonationService } from '../../../../core/services/impersonation.service';
import { subscriptionStatusLabel } from '../../subscription-status';

@Component({
  selector: 'app-admin-companies-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    StatTile,
    AdminTabs,
  ],
  templateUrl: './admin-companies.html',
  styleUrl: './admin-companies.scss',
})
export class AdminCompaniesPage implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly dialog = inject(MatDialog);
  private readonly impersonation = inject(ImpersonationService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly displayedColumns = ['name', 'status', 'plan', 'expiresAt', 'users', 'createdAt', 'actions'];
  readonly statusOptions: SubscriptionStatus[] = ['PENDING', 'TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED'];

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<SubscriptionStatus | ''>('', { nonNullable: true });

  readonly companies = signal<AdminCompanyRow[]>([]);
  readonly stats = signal<AdminStats | null>(null);
  readonly total = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.pageIndex.set(0);
        this.load();
      });

    this.statusControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.pageIndex.set(0);
      this.load();
    });
  }

  ngOnInit(): void {
    this.load();
    this.loadStats();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.adminService
      .listCompanies({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        search: this.searchControl.value || undefined,
        status: this.statusControl.value || undefined,
      })
      .subscribe({
        next: (result) => {
          this.companies.set(result.data);
          this.total.set(result.meta.total);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.hasError.set(true);
          if (error.status === 403) {
            this.snackBar.open('Acesso restrito à equipe Kotrim.', 'Fechar', { duration: 5000 });
          }
        },
      });
  }

  loadStats(): void {
    this.adminService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
      // Non-fatal: the tiles just stay hidden, the table below still works.
      error: () => this.stats.set(null),
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  statusLabel(status: SubscriptionStatus): string {
    return subscriptionStatusLabel(status);
  }

  /**
   * Whichever date actually governs this company's access. Falls back to the
   * trial end because an EXPIRED company that never paid has no
   * `currentPeriodEnd` — showing a dash there would hide the one date that
   * explains why it is locked out.
   */
  expiresAt(company: AdminCompanyRow): string | null {
    const subscription = company.subscription;
    if (!subscription) return null;
    if (subscription.status === 'TRIAL') return subscription.trialEndsAt;
    return subscription.currentPeriodEnd ?? subscription.trialEndsAt;
  }

  activate(company: AdminCompanyRow): void {
    this.dialog
      .open(ActivateSubscriptionDialog, { data: { company }, width: '440px' })
      .afterClosed()
      .subscribe((changed) => {
        if (changed) this.refresh();
      });
  }

  changeDueDate(company: AdminCompanyRow): void {
    this.dialog
      .open(ChangeDueDateDialog, { data: { company }, width: '420px' })
      .afterClosed()
      .subscribe((changed) => {
        if (changed) this.refresh();
      });
  }

  cancel(company: AdminCompanyRow): void {
    const subscriptionId = company.subscription?.id;
    if (!subscriptionId) return;

    const data: ConfirmDialogData = {
      title: 'Cancelar assinatura',
      message: `A empresa "${company.name}" perderá o acesso ao sistema imediatamente. Os dados são mantidos.`,
      confirmLabel: 'Cancelar assinatura',
      cancelLabel: 'Voltar',
      danger: true,
    };

    this.dialog
      .open(ConfirmDialog, { data, width: '420px' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.adminService.cancel(subscriptionId).subscribe({
          next: () => {
            this.snackBar.open('Assinatura cancelada.', 'Fechar', { duration: 3000 });
            this.refresh();
          },
          error: () => this.snackBar.open('Não foi possível cancelar.', 'Fechar', { duration: 4000 }),
        });
      });
  }

  /** Opens a read-only support session inside the company. */
  viewAs(company: AdminCompanyRow): void {
    this.impersonation.start(company.id).subscribe({
      next: () => void this.router.navigateByUrl('/dashboard'),
      error: (error: HttpErrorResponse) => {
        const backendMessage = (error.error as { message?: string } | null)?.message;
        this.snackBar.open(backendMessage || 'Não foi possível abrir a visualização.', 'Fechar', {
          duration: 5000,
        });
      },
    });
  }

  private refresh(): void {
    this.load();
    this.loadStats();
  }
}
