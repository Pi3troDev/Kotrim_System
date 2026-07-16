import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PAYMENT_METHODS } from '../../../../shared/constants/payment-methods';
import { AccountsService } from '../../services/accounts.service';
import { ExpensesService } from '../../services/expenses.service';
import { IncomesService } from '../../services/incomes.service';
import { Account, CreatePaymentPayload, Expense, Income, Payment } from '../../interfaces/finance.interfaces';

export type PaymentDialogKind = 'expense' | 'income';

export interface PaymentDialogData {
  record: Expense | Income;
  kind: PaymentDialogKind;
}

@Component({
  selector: 'app-payment-dialog',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './payment-dialog.html',
  styleUrl: './payment-dialog.scss',
})
export class PaymentDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly accountsService = inject(AccountsService);
  private readonly expensesService = inject(ExpensesService);
  private readonly incomesService = inject(IncomesService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<PaymentDialog>);
  readonly data = inject<PaymentDialogData>(MAT_DIALOG_DATA);

  readonly record = signal(this.data.record);
  readonly payments = signal<Payment[]>([]);
  readonly accounts = signal<Account[]>([]);
  readonly isLoadingPayments = signal(true);
  readonly isSubmitting = signal(false);
  /** Tracks whether anything changed so the parent list can refresh. */
  private didChange = false;

  readonly remainingBalance = computed(() => Math.max(0, this.record().amount - this.record().paidAmount));
  readonly canAddPayment = computed(() => this.record().status !== 'CANCELLED' && this.remainingBalance() > 0);
  readonly paymentMethods = PAYMENT_METHODS;

  readonly form = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    accountId: [''],
    paymentMethod: [''],
    paidAt: [new Date(), Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    this.form.patchValue({ amount: this.remainingBalance() });
    this.loadPayments();
    this.accountsService.list().subscribe({ next: (accounts) => this.accounts.set(accounts) });
  }

  loadPayments(): void {
    this.isLoadingPayments.set(true);
    const request$ = this.data.kind === 'expense' ? this.expensesService.listPayments(this.record().id) : this.incomesService.listPayments(this.record().id);
    request$.subscribe({
      next: (payments) => {
        this.payments.set(payments);
        this.isLoadingPayments.set(false);
      },
      error: () => this.isLoadingPayments.set(false),
    });
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();
    const payload: CreatePaymentPayload = {
      amount: raw.amount,
      accountId: raw.accountId || undefined,
      paymentMethod: raw.paymentMethod || undefined,
      paidAt: this.toIsoDate(raw.paidAt),
      notes: raw.notes.trim() || undefined,
    };

    const request$: Observable<Expense | Income> =
      this.data.kind === 'expense'
        ? this.expensesService.addPayment(this.record().id, payload)
        : this.incomesService.addPayment(this.record().id, payload);

    request$.subscribe({
      next: (updated) => {
        this.record.set(updated);
        this.isSubmitting.set(false);
        this.didChange = true;
        this.form.reset({ amount: this.remainingBalance(), accountId: '', paymentMethod: '', paidAt: new Date(), notes: '' });
        this.loadPayments();
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.snackBar.open(this.resolveErrorMessage(error), 'Fechar', { duration: 5000 });
      },
    });
  }

  removePayment(payment: Payment): void {
    const request$ =
      this.data.kind === 'expense'
        ? this.expensesService.removePayment(this.record().id, payment.id)
        : this.incomesService.removePayment(this.record().id, payment.id);

    request$.subscribe({
      next: () => {
        this.didChange = true;
        this.snackBar.open('Pagamento removido.', 'Fechar', { duration: 3000 });
        this.refreshRecord();
        this.loadPayments();
      },
      error: () => this.snackBar.open('Não foi possível remover o pagamento.', 'Fechar', { duration: 4000 }),
    });
  }

  close(): void {
    this.dialogRef.close(this.didChange);
  }

  private refreshRecord(): void {
    const request$: Observable<Expense | Income> =
      this.data.kind === 'expense' ? this.expensesService.get(this.record().id) : this.incomesService.get(this.record().id);
    request$.subscribe({
      next: (updated) => {
        this.record.set(updated);
        this.form.patchValue({ amount: Math.max(0, updated.amount - updated.paidAmount) });
      },
    });
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

    return 'Não foi possível registrar o pagamento.';
  }
}
