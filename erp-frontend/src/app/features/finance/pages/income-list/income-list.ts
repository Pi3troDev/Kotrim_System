import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FINANCIAL_STATUS_META } from '../../../../shared/constants/financial-status';
import { ConfirmDialog, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { StatTile } from '../../../../shared/components/stat-tile/stat-tile';
import { FinanceTabs } from '../../components/finance-tabs/finance-tabs';
import { IncomeFormDialog, IncomeFormDialogData } from '../../components/income-form-dialog/income-form-dialog';
import { PaymentDialog, PaymentDialogData } from '../../components/payment-dialog/payment-dialog';
import { IncomesService } from '../../services/incomes.service';
import { AccountsService } from '../../services/accounts.service';
import { FinancialStatus, Income, IncomesSummary } from '../../interfaces/finance.interfaces';

const DEFAULT_PAGE_SIZE = 20;
const INCOME_STATUS_LABELS: Partial<Record<FinancialStatus, string>> = { PAID: 'Recebido' };
const ACTIONABLE_STATUSES: FinancialStatus[] = ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'];

@Component({
  selector: 'app-income-list',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    FinanceTabs,
    StatTile,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './income-list.html',
  styleUrl: './income-list.scss',
})
export class IncomeList implements OnInit, OnDestroy {
  private readonly incomesService = inject(IncomesService);
  private readonly accountsService = inject(AccountsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyed$ = new Subject<void>();

  readonly displayedColumns = ['description', 'client', 'amount', 'dueDate', 'status', 'actions'];
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<FinancialStatus | ''>('', { nonNullable: true });
  readonly statusMeta = FINANCIAL_STATUS_META;
  readonly statusOptions: FinancialStatus[] = ['PENDING', 'OVERDUE', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'];

  readonly incomes = signal<Income[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly summary = signal<IncomesSummary | null>(null);
  readonly accountsBalance = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
    this.loadSummary();
    this.loadAccountsBalance();

    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroyed$))
      .subscribe(() => {
        this.page.set(1);
        this.load();
      });

    this.statusControl.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  statusLabel(status: FinancialStatus): string {
    return INCOME_STATUS_LABELS[status] ?? this.statusMeta[status].label;
  }

  isActionable(income: Income): boolean {
    return ACTIONABLE_STATUSES.includes(income.status);
  }

  isRecurring(income: Income): boolean {
    return !!income.recurrenceFrequency;
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.incomesService
      .list({
        page: this.page(),
        limit: this.limit(),
        search: this.searchControl.value || undefined,
        status: this.statusControl.value || undefined,
      })
      .subscribe({
        next: (result) => {
          this.incomes.set(result.data);
          this.total.set(result.meta.total);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.hasError.set(true);
        },
      });
  }

  loadSummary(): void {
    this.incomesService.summary().subscribe({ next: (summary) => this.summary.set(summary) });
  }

  loadAccountsBalance(): void {
    this.accountsService.list().subscribe({
      next: (accounts) => {
        const total = accounts.filter((account) => account.isActive).reduce((sum, account) => sum + account.currentBalance, 0);
        this.accountsBalance.set(total);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.load();
  }

  openCreateDialog(): void {
    this.openFormDialog({});
  }

  openEditDialog(income: Income): void {
    this.openFormDialog({ income });
  }

  openPaymentDialog(income: Income): void {
    const data: PaymentDialogData = { record: income, kind: 'income' };

    this.dialog
      .open(PaymentDialog, { data, width: '600px' })
      .afterClosed()
      .subscribe((changed: boolean | undefined) => {
        if (changed) this.refreshAll();
      });
  }

  stopRecurrence(income: Income): void {
    const data: ConfirmDialogData = {
      title: 'Parar recorrência',
      message: `Nenhuma nova ocorrência de "${income.description}" será gerada. As ocorrências já criadas não são afetadas.`,
      confirmLabel: 'Parar recorrência',
      danger: false,
    };

    this.dialog
      .open(ConfirmDialog, { data, width: '420px' })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;

        this.incomesService.stopRecurrence(income.id).subscribe({
          next: () => {
            this.snackBar.open('Recorrência interrompida.', 'Fechar', { duration: 3000 });
            this.load();
          },
          error: () => this.snackBar.open('Não foi possível interromper a recorrência.', 'Fechar', { duration: 4000 }),
        });
      });
  }

  cancelIncome(income: Income): void {
    const data: ConfirmDialogData = {
      title: 'Cancelar receita',
      message: `Tem certeza que deseja cancelar "${income.description}"?`,
      confirmLabel: 'Cancelar receita',
      danger: true,
    };

    this.dialog
      .open(ConfirmDialog, { data, width: '420px' })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;

        this.incomesService.updateStatus(income.id, { status: 'CANCELLED' }).subscribe({
          next: () => {
            this.snackBar.open('Receita cancelada.', 'Fechar', { duration: 3000 });
            this.refreshAll();
          },
          error: () => this.snackBar.open('Não foi possível cancelar a receita.', 'Fechar', { duration: 4000 }),
        });
      });
  }

  revertToPending(income: Income): void {
    this.incomesService.updateStatus(income.id, { status: 'PENDING' }).subscribe({
      next: () => {
        this.snackBar.open('Receita revertida para pendente.', 'Fechar', { duration: 3000 });
        this.refreshAll();
      },
      error: () => this.snackBar.open('Não foi possível atualizar a receita.', 'Fechar', { duration: 4000 }),
    });
  }

  confirmDelete(income: Income): void {
    const data: ConfirmDialogData = {
      title: 'Excluir receita',
      message: `Tem certeza que deseja excluir "${income.description}"?`,
      confirmLabel: 'Excluir',
      danger: true,
    };

    this.dialog
      .open(ConfirmDialog, { data, width: '420px' })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;

        this.incomesService.remove(income.id).subscribe({
          next: () => {
            this.snackBar.open('Receita excluída.', 'Fechar', { duration: 3000 });
            this.refreshAll();
          },
          error: () => this.snackBar.open('Não foi possível excluir a receita.', 'Fechar', { duration: 4000 }),
        });
      });
  }

  private refreshAll(): void {
    this.load();
    this.loadSummary();
    this.loadAccountsBalance();
  }

  private openFormDialog(data: IncomeFormDialogData): void {
    this.dialog
      .open(IncomeFormDialog, { data, width: '560px' })
      .afterClosed()
      .subscribe((result: Income[] | undefined) => {
        if (result && result.length > 0) {
          this.refreshAll();
        }
      });
  }
}
