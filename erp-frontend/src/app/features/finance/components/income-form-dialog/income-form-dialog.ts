import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap } from 'rxjs';
import { PAYMENT_METHODS } from '../../../../shared/constants/payment-methods';
import { RECURRENCE_FREQUENCIES, RECURRENCE_FREQUENCY_LABELS, RecurrenceFrequency } from '../../../../shared/constants/recurrence-frequency';
import { CategoriesService } from '../../../inventory/services/categories.service';
import { Category } from '../../../inventory/interfaces/inventory.interfaces';
import { ClientsService } from '../../../clients/services/clients.service';
import { Client } from '../../../clients/interfaces/client.interfaces';
import { IncomesService } from '../../services/incomes.service';
import { AccountsService } from '../../services/accounts.service';
import { Account, CreateIncomePayload, Income } from '../../interfaces/finance.interfaces';
import { AccountManagerDialog } from '../account-manager-dialog/account-manager-dialog';

export interface IncomeFormDialogData {
  income?: Income;
}

type SelectedClient = Pick<Client, 'id' | 'name'>;

@Component({
  selector: 'app-income-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './income-form-dialog.html',
  styleUrl: './income-form-dialog.scss',
})
export class IncomeFormDialog implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);
  private readonly clientsService = inject(ClientsService);
  private readonly accountsService = inject(AccountsService);
  private readonly incomesService = inject(IncomesService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<IncomeFormDialog>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyed$ = new Subject<void>();
  readonly data = inject<IncomeFormDialogData>(MAT_DIALOG_DATA);

  readonly isEditMode = !!this.data.income;
  readonly isSubmitting = signal(false);
  readonly categories = signal<Category[]>([]);
  readonly accounts = signal<Account[]>([]);
  readonly paymentMethods = PAYMENT_METHODS;
  readonly recurrenceFrequencies = RECURRENCE_FREQUENCIES;
  readonly recurrenceFrequencyLabels = RECURRENCE_FREQUENCY_LABELS;

  readonly clientOptions = signal<Client[]>([]);
  readonly isSearchingClients = signal(false);
  readonly selectedClientId = signal<string | null>(this.data.income?.clientId ?? null);

  readonly clientSearchControl = this.fb.nonNullable.control<SelectedClient | string>(
    this.data.income?.client ?? '',
  );

  readonly displayClient = (value: SelectedClient | string): string =>
    typeof value === 'string' ? value : (value?.name ?? '');

  readonly form = this.fb.nonNullable.group({
    description: [this.data.income?.description ?? '', [Validators.required, Validators.minLength(1)]],
    amount: [this.data.income?.amount ?? 0, [Validators.required, Validators.min(0.01)]],
    dueDate: [this.data.income ? new Date(this.data.income.dueDate) : new Date(), Validators.required],
    paymentMethod: [this.data.income?.paymentMethod ?? ''],
    categoryId: [this.data.income?.categoryId ?? ''],
    accountId: [this.data.income?.accountId ?? ''],
    installmentsEnabled: [false],
    installmentsCount: [3, [Validators.min(2), Validators.max(24)]],
    recurrenceEnabled: [false],
    recurrenceFrequency: this.fb.nonNullable.control<RecurrenceFrequency>('MONTHLY'),
    recurrenceEndDate: this.fb.control<Date | null>(null),
  });

  readonly installmentsEnabled = toSignal(this.form.controls.installmentsEnabled.valueChanges, {
    initialValue: this.form.controls.installmentsEnabled.value,
  });
  readonly recurrenceEnabled = toSignal(this.form.controls.recurrenceEnabled.valueChanges, {
    initialValue: this.form.controls.recurrenceEnabled.value,
  });

  constructor() {
    this.clientSearchControl.valueChanges
      .pipe(
        tap((value) => this.selectedClientId.set(typeof value === 'string' ? null : (value?.id ?? null))),
        filter((value): value is string => typeof value === 'string'),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          this.isSearchingClients.set(true);
          return this.clientsService.list({ page: 1, limit: 10, search: term || undefined });
        }),
        takeUntil(this.destroyed$),
      )
      .subscribe({
        next: (result) => {
          this.clientOptions.set(result.data);
          this.isSearchingClients.set(false);
        },
        error: () => this.isSearchingClients.set(false),
      });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadAccounts();

    // Installments and recurrence are mutually exclusive — enabling one turns the other off.
    this.form.controls.installmentsEnabled.valueChanges.subscribe((enabled) => {
      if (enabled && this.form.controls.recurrenceEnabled.value) {
        this.form.controls.recurrenceEnabled.setValue(false);
      }
    });
    this.form.controls.recurrenceEnabled.valueChanges.subscribe((enabled) => {
      if (enabled && this.form.controls.installmentsEnabled.value) {
        this.form.controls.installmentsEnabled.setValue(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  openAccountManager(): void {
    this.dialog
      .open(AccountManagerDialog, { width: '560px' })
      .afterClosed()
      .subscribe((changed: boolean | undefined) => {
        if (changed) this.loadAccounts();
      });
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const payload = this.buildPayload();

    const request$ = this.isEditMode
      ? this.incomesService.update(this.data.income!.id, payload).pipe(map((income) => [income]))
      : this.incomesService.create(payload);

    request$.subscribe({
      next: (result) => this.dialogRef.close(result),
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.snackBar.open(this.resolveErrorMessage(error), 'Fechar', { duration: 6000 });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private loadCategories(): void {
    this.categoriesService.list('INCOME').subscribe({ next: (categories) => this.categories.set(categories) });
  }

  private loadAccounts(): void {
    this.accountsService.list().subscribe({ next: (accounts) => this.accounts.set(accounts) });
  }

  private buildPayload(): CreateIncomePayload {
    const raw = this.form.getRawValue();

    return {
      description: raw.description.trim(),
      amount: raw.amount,
      dueDate: this.toIsoDate(raw.dueDate),
      paymentMethod: raw.paymentMethod || undefined,
      categoryId: raw.categoryId || undefined,
      clientId: this.selectedClientId() || undefined,
      accountId: raw.accountId || undefined,
      installments: !this.isEditMode && raw.installmentsEnabled ? raw.installmentsCount : undefined,
      recurrenceFrequency: !this.isEditMode && raw.recurrenceEnabled ? raw.recurrenceFrequency : undefined,
      recurrenceEndDate:
        !this.isEditMode && raw.recurrenceEnabled && raw.recurrenceEndDate ? this.toIsoDate(raw.recurrenceEndDate) : undefined,
    };
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) {
      const backendMessage = (error.error as { message?: string | string[] } | null)?.message;
      if (Array.isArray(backendMessage) && backendMessage.length > 0) {
        return backendMessage.join(' ');
      }
      if (typeof backendMessage === 'string') {
        return backendMessage;
      }
    }

    return 'Não foi possível salvar a receita. Verifique os dados e tente novamente.';
  }
}
