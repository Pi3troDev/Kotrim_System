import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubscriptionService } from '../../../subscription/services/subscription.service';
import { Plan } from '../../../subscription/interfaces/subscription.interfaces';
import { AdminService } from '../../services/admin.service';
import { AdminCompanyRow } from '../../interfaces/admin.interfaces';

export interface ActivateDialogData {
  company: AdminCompanyRow;
}

@Component({
  selector: 'app-activate-subscription-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './activate-subscription-dialog.html',
  styleUrl: './activate-subscription-dialog.scss',
})
export class ActivateSubscriptionDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<ActivateSubscriptionDialog, boolean>);
  readonly data = inject<ActivateDialogData>(MAT_DIALOG_DATA);

  readonly plans = signal<Plan[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);

  readonly form = this.fb.nonNullable.group({
    planId: ['', Validators.required],
    // Defaults to one month out — the overwhelmingly common case for a monthly
    // plan, and still editable.
    periodEnd: [oneMonthFromNow(), Validators.required],
    method: ['PIX'],
    notes: [''],
  });

  ngOnInit(): void {
    this.subscriptionService.listPlans().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        // Pre-select whatever plan the workshop asked for at checkout.
        const requested = this.data.company.subscription?.plan?.id;
        if (requested) {
          this.form.patchValue({ planId: requested });
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Não foi possível carregar os planos.', 'Fechar', { duration: 4000 });
      },
    });
  }

  submit(): void {
    const subscriptionId = this.data.company.subscription?.id;
    if (this.form.invalid || this.isSaving() || !subscriptionId) {
      this.form.markAllAsTouched();
      return;
    }

    const { planId, periodEnd, method, notes } = this.form.getRawValue();
    this.isSaving.set(true);

    this.adminService
      .activate(subscriptionId, {
        planId,
        periodEnd: toDateOnly(periodEnd),
        method: method || undefined,
        notes: notes || undefined,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Assinatura ativada.', 'Fechar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error: HttpErrorResponse) => {
          this.isSaving.set(false);
          const backendMessage = (error.error as { message?: string | string[] } | null)?.message;
          const message = Array.isArray(backendMessage) ? backendMessage.join(' ') : backendMessage;
          this.snackBar.open(message || 'Não foi possível ativar a assinatura.', 'Fechar', { duration: 5000 });
        },
      });
  }
}

function oneMonthFromNow(): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
}

/** Serialises as a local YYYY-MM-DD; toISOString() would shift the day in UTC-3. */
function toDateOnly(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
