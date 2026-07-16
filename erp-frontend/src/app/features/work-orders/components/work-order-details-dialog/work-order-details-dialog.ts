import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkOrdersService } from '../../services/work-orders.service';
import { WorkOrder } from '../../interfaces/work-order.interfaces';

export interface WorkOrderDetailsDialogData {
  workOrder: WorkOrder;
}

@Component({
  selector: 'app-work-order-details-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './work-order-details-dialog.html',
  styleUrl: './work-order-details-dialog.scss',
})
export class WorkOrderDetailsDialog {
  private readonly fb = inject(FormBuilder);
  private readonly workOrdersService = inject(WorkOrdersService);
  private readonly dialogRef = inject(MatDialogRef<WorkOrderDetailsDialog>);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<WorkOrderDetailsDialogData>(MAT_DIALOG_DATA);

  readonly isSubmitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    reportedProblem: [this.data.workOrder.reportedProblem, [Validators.required, Validators.minLength(3)]],
    diagnosis: [this.data.workOrder.diagnosis ?? ''],
    observations: [this.data.workOrder.observations ?? ''],
    discountAmount: [this.data.workOrder.discountAmount, [Validators.min(0)]],
    warrantyDays: [this.data.workOrder.warrantyDays, [Validators.min(0)]],
  });

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    this.workOrdersService
      .update(this.data.workOrder.id, {
        reportedProblem: raw.reportedProblem.trim(),
        diagnosis: raw.diagnosis.trim() || undefined,
        observations: raw.observations.trim() || undefined,
        discountAmount: raw.discountAmount,
        warrantyDays: raw.warrantyDays,
      })
      .subscribe({
        next: (workOrder: WorkOrder) => this.dialogRef.close(workOrder),
        error: () => {
          this.isSubmitting.set(false);
          this.snackBar.open('Não foi possível salvar as alterações. Tente novamente.', 'Fechar', { duration: 5000 });
        },
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
