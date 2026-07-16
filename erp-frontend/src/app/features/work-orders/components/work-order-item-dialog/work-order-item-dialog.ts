import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkOrdersService } from '../../services/work-orders.service';
import { WorkOrder, WorkOrderItem, WorkOrderItemType } from '../../interfaces/work-order.interfaces';

export interface WorkOrderItemDialogData {
  workOrderId: string;
  item?: WorkOrderItem;
}

@Component({
  selector: 'app-work-order-item-dialog',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './work-order-item-dialog.html',
  styleUrl: './work-order-item-dialog.scss',
})
export class WorkOrderItemDialog {
  private readonly fb = inject(FormBuilder);
  private readonly workOrdersService = inject(WorkOrdersService);
  private readonly dialogRef = inject(MatDialogRef<WorkOrderItemDialog>);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<WorkOrderItemDialogData>(MAT_DIALOG_DATA);

  readonly isEditMode = !!this.data.item;
  readonly isSubmitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    type: this.fb.nonNullable.control<WorkOrderItemType>(this.data.item?.type ?? 'SERVICE', Validators.required),
    description: [this.data.item?.description ?? '', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
    quantity: [this.data.item?.quantity ?? 1, [Validators.required, Validators.min(0.01)]],
    unitPrice: [this.data.item?.unitPrice ?? 0, [Validators.required, Validators.min(0)]],
  });

  private readonly quantitySignal = toSignal(this.form.controls.quantity.valueChanges, {
    initialValue: this.form.controls.quantity.value,
  });
  private readonly unitPriceSignal = toSignal(this.form.controls.unitPrice.valueChanges, {
    initialValue: this.form.controls.unitPrice.value,
  });

  readonly totalPreview = computed(() => (this.quantitySignal() || 0) * (this.unitPriceSignal() || 0));

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const payload = this.form.getRawValue();

    const request$ = this.isEditMode
      ? this.workOrdersService.updateItem(this.data.workOrderId, this.data.item!.id, payload)
      : this.workOrdersService.addItem(this.data.workOrderId, payload);

    request$.subscribe({
      next: (workOrder: WorkOrder) => this.dialogRef.close(workOrder),
      error: () => {
        this.isSubmitting.set(false);
        this.snackBar.open('Não foi possível salvar o item. Tente novamente.', 'Fechar', { duration: 5000 });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
