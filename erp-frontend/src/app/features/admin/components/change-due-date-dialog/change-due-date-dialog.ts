import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../services/admin.service';
import { AdminCompanyRow } from '../../interfaces/admin.interfaces';

export interface ChangeDueDateDialogData {
  company: AdminCompanyRow;
}

/**
 * Edits whichever clock is actually running for this subscription: the trial
 * end for a TRIAL, the billing due date otherwise. Showing both fields at once
 * would invite setting the one that has no effect on access.
 */
@Component({
  selector: 'app-change-due-date-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './change-due-date-dialog.html',
  styleUrl: './change-due-date-dialog.scss',
})
export class ChangeDueDateDialog {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<ChangeDueDateDialog, boolean>);
  readonly data = inject<ChangeDueDateDialogData>(MAT_DIALOG_DATA);

  readonly isSaving = signal(false);
  readonly isTrial = this.data.company.subscription?.status === 'TRIAL';

  readonly form = this.fb.nonNullable.group({
    date: [this.currentDate(), Validators.required],
  });

  submit(): void {
    const subscriptionId = this.data.company.subscription?.id;
    if (this.form.invalid || this.isSaving() || !subscriptionId) {
      this.form.markAllAsTouched();
      return;
    }

    const date = toDateOnly(this.form.getRawValue().date);
    this.isSaving.set(true);

    this.adminService
      .updateDates(subscriptionId, this.isTrial ? { trialEndsAt: date } : { currentPeriodEnd: date })
      .subscribe({
        next: () => {
          this.snackBar.open('Data atualizada.', 'Fechar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error: HttpErrorResponse) => {
          this.isSaving.set(false);
          const backendMessage = (error.error as { message?: string | string[] } | null)?.message;
          const message = Array.isArray(backendMessage) ? backendMessage.join(' ') : backendMessage;
          this.snackBar.open(message || 'Não foi possível alterar a data.', 'Fechar', { duration: 5000 });
        },
      });
  }

  private currentDate(): Date {
    const subscription = this.data.company.subscription;
    const existing = this.isTrial ? subscription?.trialEndsAt : subscription?.currentPeriodEnd;
    return existing ? new Date(existing) : new Date();
  }
}

/** Serialises as a local YYYY-MM-DD; toISOString() would shift the day in UTC-3. */
function toDateOnly(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
