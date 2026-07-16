import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPES, AccountType } from '../../../../shared/constants/account-types';
import { AccountsService } from '../../services/accounts.service';
import { Account } from '../../interfaces/finance.interfaces';

@Component({
  selector: 'app-account-manager-dialog',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './account-manager-dialog.html',
  styleUrl: './account-manager-dialog.scss',
})
export class AccountManagerDialog {
  private readonly fb = inject(FormBuilder);
  private readonly accountsService = inject(AccountsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<AccountManagerDialog>);

  readonly accounts = signal<Account[]>([]);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly accountTypes = ACCOUNT_TYPES;
  readonly accountTypeLabels = ACCOUNT_TYPE_LABELS;
  /** Tracks whether anything changed so the parent form dialog can refresh its account select. */
  private didChange = false;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
    type: this.fb.nonNullable.control<AccountType>('BANK', Validators.required),
    initialBalance: [0],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.accountsService.list().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  add(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    this.accountsService.create({ name: raw.name.trim(), type: raw.type, initialBalance: raw.initialBalance }).subscribe({
      next: (account) => {
        this.accounts.update((list) => [...list, account].sort((a, b) => a.name.localeCompare(b.name)));
        this.form.reset({ name: '', type: 'BANK', initialBalance: 0 });
        this.isSubmitting.set(false);
        this.didChange = true;
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        const message = error.status === 409 ? 'Já existe uma conta com esse nome.' : 'Não foi possível criar a conta.';
        this.snackBar.open(message, 'Fechar', { duration: 4000 });
      },
    });
  }

  remove(account: Account): void {
    this.accountsService.remove(account.id).subscribe({
      next: () => {
        this.accounts.update((list) => list.filter((a) => a.id !== account.id));
        this.didChange = true;
      },
      error: () => this.snackBar.open('Não foi possível excluir a conta.', 'Fechar', { duration: 4000 }),
    });
  }

  close(): void {
    this.dialogRef.close(this.didChange);
  }
}
