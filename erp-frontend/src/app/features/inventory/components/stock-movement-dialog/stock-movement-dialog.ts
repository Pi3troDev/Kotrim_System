import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InventoryItemsService } from '../../services/inventory-items.service';
import { InventoryItem, StockMovementType } from '../../interfaces/inventory.interfaces';

export interface StockMovementDialogData {
  item: InventoryItem;
}

@Component({
  selector: 'app-stock-movement-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './stock-movement-dialog.html',
  styleUrl: './stock-movement-dialog.scss',
})
export class StockMovementDialog {
  private readonly fb = inject(FormBuilder);
  private readonly inventoryItemsService = inject(InventoryItemsService);
  private readonly dialogRef = inject(MatDialogRef<StockMovementDialog>);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<StockMovementDialogData>(MAT_DIALOG_DATA);

  readonly isSubmitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    type: this.fb.nonNullable.control<StockMovementType>('IN', Validators.required),
    quantity: [0, [Validators.required, Validators.min(0)]],
    reason: [''],
  });

  private readonly typeSignal = toSignal(this.form.controls.type.valueChanges, { initialValue: this.form.controls.type.value });
  private readonly quantitySignal = toSignal(this.form.controls.quantity.valueChanges, {
    initialValue: this.form.controls.quantity.value,
  });

  readonly resultingQuantity = computed(() => {
    const type = this.typeSignal();
    const quantity = this.quantitySignal() || 0;
    const current = this.data.item.quantityInStock;

    if (type === 'IN') return current + quantity;
    if (type === 'OUT') return current - quantity;
    return quantity;
  });

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.type !== 'ADJUSTMENT' && raw.quantity <= 0) {
      this.snackBar.open('Informe uma quantidade maior que zero.', 'Fechar', { duration: 4000 });
      return;
    }

    this.isSubmitting.set(true);

    this.inventoryItemsService
      .createMovement(this.data.item.id, { type: raw.type, quantity: raw.quantity, reason: raw.reason.trim() || undefined })
      .subscribe({
        next: (item: InventoryItem) => this.dialogRef.close(item),
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.snackBar.open(this.resolveErrorMessage(error), 'Fechar', { duration: 5000 });
        },
      });
  }

  cancel(): void {
    this.dialogRef.close();
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

    return 'Não foi possível registrar a movimentação.';
  }
}
