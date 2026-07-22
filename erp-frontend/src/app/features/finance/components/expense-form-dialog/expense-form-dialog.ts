import { Component, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PAYMENT_METHODS } from '../../../../shared/constants/payment-methods';
import { RECURRENCE_FREQUENCIES, RECURRENCE_FREQUENCY_LABELS, RecurrenceFrequency } from '../../../../shared/constants/recurrence-frequency';
import { CategoriesService } from '../../../inventory/services/categories.service';
import { Category } from '../../../inventory/interfaces/inventory.interfaces';
import { ExpensesService } from '../../services/expenses.service';
import { AccountsService } from '../../services/accounts.service';
import { Account, CreateExpensePayload, Expense } from '../../interfaces/finance.interfaces';
import { AccountManagerDialog } from '../account-manager-dialog/account-manager-dialog';
import { CategoryManagerDialog } from '../../../inventory/components/category-manager-dialog/category-manager-dialog';

export interface ExpenseFormDialogData {
  expense?: Expense;
}

@Component({
  selector: 'app-expense-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './expense-form-dialog.html',
  styleUrl: './expense-form-dialog.scss',
})
export class ExpenseFormDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);
  private readonly accountsService = inject(AccountsService);
  private readonly expensesService = inject(ExpensesService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<ExpenseFormDialog>);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<ExpenseFormDialogData>(MAT_DIALOG_DATA);

  readonly isEditMode = !!this.data.expense;
  readonly isSubmitting = signal(false);
  readonly categories = signal<Category[]>([]);
  readonly accounts = signal<Account[]>([]);
  readonly paymentMethods = PAYMENT_METHODS;
  readonly recurrenceFrequencies = RECURRENCE_FREQUENCIES;
  readonly recurrenceFrequencyLabels = RECURRENCE_FREQUENCY_LABELS;

  readonly form = this.fb.nonNullable.group({
    description: [this.data.expense?.description ?? '', [Validators.required, Validators.minLength(1)]],
    amount: [this.data.expense?.amount ?? 0, [Validators.required, Validators.min(0.01)]],
    dueDate: [this.data.expense ? new Date(this.data.expense.dueDate) : new Date(), Validators.required],
    paymentMethod: [this.data.expense?.paymentMethod ?? ''],
    categoryId: [this.data.expense?.categoryId ?? ''],
    accountId: [this.data.expense?.accountId ?? ''],
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

  openAccountManager(): void {
    this.dialog
      .open(AccountManagerDialog, { width: '620px' })
      .afterClosed()
      .subscribe((changed: boolean | undefined) => {
        if (changed) this.loadAccounts();
      });
  }

  openCategoryManager(): void {
    this.dialog
      .open(CategoryManagerDialog, { width: '440px', data: { type: 'EXPENSE' } })
      .afterClosed()
      .subscribe((changed: boolean | undefined) => {
        if (changed) this.loadCategories();
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
      ? this.expensesService.update(this.data.expense!.id, payload).pipe(map((expense) => [expense]))
      : this.expensesService.create(payload);

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
    this.categoriesService.list('EXPENSE').subscribe({ next: (categories) => this.categories.set(categories) });
  }

  private loadAccounts(): void {
    this.accountsService.list().subscribe({ next: (accounts) => this.accounts.set(accounts) });
  }

  private buildPayload(): CreateExpensePayload {
    const raw = this.form.getRawValue();

    return {
      description: raw.description.trim(),
      amount: raw.amount,
      dueDate: this.toIsoDate(raw.dueDate),
      paymentMethod: raw.paymentMethod || undefined,
      categoryId: raw.categoryId || undefined,
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

    return 'Não foi possível salvar a despesa. Verifique os dados e tente novamente.';
  }
}
