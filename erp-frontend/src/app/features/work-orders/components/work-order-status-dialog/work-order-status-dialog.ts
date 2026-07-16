import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WORK_ORDER_STATUS_FLOW, WORK_ORDER_STATUS_META } from '../../../../shared/constants/work-order-status';
import { WorkOrdersService } from '../../services/work-orders.service';
import { WorkOrder, WorkOrderStatus } from '../../interfaces/work-order.interfaces';

export interface WorkOrderStatusDialogData {
  workOrderId: string;
  currentStatus: WorkOrderStatus;
}

@Component({
  selector: 'app-work-order-status-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './work-order-status-dialog.html',
  styleUrl: './work-order-status-dialog.scss',
})
export class WorkOrderStatusDialog {
  private readonly fb = inject(FormBuilder);
  private readonly workOrdersService = inject(WorkOrdersService);
  private readonly dialogRef = inject(MatDialogRef<WorkOrderStatusDialog>);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<WorkOrderStatusDialogData>(MAT_DIALOG_DATA);

  readonly isSubmitting = signal(false);
  readonly statusMeta = WORK_ORDER_STATUS_META;
  readonly availableStatuses = this.computeAvailableStatuses();

  readonly form = this.fb.nonNullable.group({
    status: this.fb.nonNullable.control<WorkOrderStatus>(this.availableStatuses[0] ?? this.data.currentStatus, Validators.required),
    notes: [''],
  });

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    this.workOrdersService
      .updateStatus(this.data.workOrderId, { status: raw.status, notes: raw.notes.trim() || undefined })
      .subscribe({
        next: (workOrder: WorkOrder) => this.dialogRef.close(workOrder),
        error: () => {
          this.isSubmitting.set(false);
          this.snackBar.open('Não foi possível atualizar o status. Tente novamente.', 'Fechar', { duration: 5000 });
        },
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private computeAvailableStatuses(): WorkOrderStatus[] {
    const flowIndex = WORK_ORDER_STATUS_FLOW.findIndex((status) => status === this.data.currentStatus);
    const forward = flowIndex >= 0 ? WORK_ORDER_STATUS_FLOW.slice(flowIndex + 1) : [];
    return [...forward, 'CANCELLED'] as WorkOrderStatus[];
  }
}
