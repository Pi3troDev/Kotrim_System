import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { InventoryItemsService } from '../../../inventory/services/inventory-items.service';
import { InventoryItem } from '../../../inventory/interfaces/inventory.interfaces';

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
export class WorkOrderItemDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly workOrdersService = inject(WorkOrdersService);
  private readonly inventoryItemsService = inject(InventoryItemsService);
  private readonly dialogRef = inject(MatDialogRef<WorkOrderItemDialog>);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<WorkOrderItemDialogData>(MAT_DIALOG_DATA);

  readonly isEditMode = !!this.data.item;
  readonly isSubmitting = signal(false);
  readonly inventoryItems = signal<InventoryItem[]>([]);

  readonly form = this.fb.nonNullable.group({
    type: this.fb.nonNullable.control<WorkOrderItemType>(this.data.item?.type ?? 'SERVICE', Validators.required),
    description: [this.data.item?.description ?? '', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
    quantity: [this.data.item?.quantity ?? 1, [Validators.required, Validators.min(0.01)]],
    unitPrice: [this.data.item?.unitPrice ?? 0, [Validators.required, Validators.min(0)]],
    inventoryItemId: this.fb.control<string | null>(this.data.item?.inventoryItemId ?? null),
  });

  private readonly quantitySignal = toSignal(this.form.controls.quantity.valueChanges, {
    initialValue: this.form.controls.quantity.value,
  });
  private readonly unitPriceSignal = toSignal(this.form.controls.unitPrice.valueChanges, {
    initialValue: this.form.controls.unitPrice.value,
  });
  private readonly typeSignal = toSignal(this.form.controls.type.valueChanges, {
    initialValue: this.form.controls.type.value,
  });

  readonly totalPreview = computed(() => (this.quantitySignal() || 0) * (this.unitPriceSignal() || 0));
  readonly isPart = computed(() => this.typeSignal() === 'PART');
  /** The linked item can't be swapped after creation — same rule the backend enforces. */
  readonly linkedInventoryItemName = computed(() => {
    const id = this.data.item?.inventoryItemId;
    if (!id) return null;
    return this.inventoryItems().find((item) => item.id === id)?.name ?? null;
  });

  ngOnInit(): void {
    this.inventoryItemsService.list({ page: 1, limit: 100 }).subscribe({
      next: (result) => this.inventoryItems.set(result.data),
    });
  }

  onInventoryItemSelected(inventoryItemId: string): void {
    const item = this.inventoryItems().find((i) => i.id === inventoryItemId);
    if (!item) return;

    this.form.patchValue({
      description: item.name,
      unitPrice: item.salePrice,
    });
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();
    // Only sent on create — the backend keeps whatever an item was originally linked to.
    const payload = this.isEditMode
      ? { type: raw.type, description: raw.description, quantity: raw.quantity, unitPrice: raw.unitPrice }
      : { ...raw, inventoryItemId: raw.inventoryItemId ?? undefined };

    const request$ = this.isEditMode
      ? this.workOrdersService.updateItem(this.data.workOrderId, this.data.item!.id, payload)
      : this.workOrdersService.addItem(this.data.workOrderId, payload);

    request$.subscribe({
      next: (workOrder: WorkOrder) => this.dialogRef.close(workOrder),
      error: (error: { error?: { message?: string | string[] } }) => {
        this.isSubmitting.set(false);
        const backendMessage = error?.error?.message;
        const message = Array.isArray(backendMessage) ? backendMessage.join(' ') : backendMessage;
        this.snackBar.open(message || 'Não foi possível salvar o item. Tente novamente.', 'Fechar', { duration: 5000 });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
