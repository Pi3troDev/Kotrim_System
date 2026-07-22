import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoriesService } from '../../services/categories.service';
import { SuppliersService } from '../../services/suppliers.service';
import { InventoryItemsService } from '../../services/inventory-items.service';
import { Category, CreateInventoryItemPayload, InventoryItem, Supplier } from '../../interfaces/inventory.interfaces';
import { CategoryManagerDialog } from '../category-manager-dialog/category-manager-dialog';

export interface ItemFormDialogData {
  item?: InventoryItem;
}

@Component({
  selector: 'app-item-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './item-form-dialog.html',
  styleUrl: './item-form-dialog.scss',
})
export class ItemFormDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);
  private readonly suppliersService = inject(SuppliersService);
  private readonly inventoryItemsService = inject(InventoryItemsService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<ItemFormDialog>);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<ItemFormDialogData>(MAT_DIALOG_DATA);

  readonly isEditMode = !!this.data.item;
  readonly isSubmitting = signal(false);
  readonly categories = signal<Category[]>([]);
  readonly suppliers = signal<Supplier[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: [this.data.item?.name ?? '', [Validators.required, Validators.minLength(1)]],
    sku: [this.data.item?.sku ?? ''],
    description: [this.data.item?.description ?? ''],
    unit: [this.data.item?.unit ?? 'UN', [Validators.required]],
    costPrice: [this.data.item?.costPrice ?? 0, [Validators.min(0)]],
    salePrice: [this.data.item?.salePrice ?? 0, [Validators.min(0)]],
    minimumStock: [this.data.item?.minimumStock ?? 0, [Validators.min(0)]],
    initialQuantity: [0, [Validators.min(0)]],
    location: [this.data.item?.location ?? ''],
    categoryId: [this.data.item?.categoryId ?? ''],
    supplierId: [this.data.item?.supplierId ?? ''],
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadSuppliers();
  }

  openCategoryManager(): void {
    this.dialog
      .open(CategoryManagerDialog, { width: '440px', data: { type: 'INVENTORY' } })
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
      ? this.inventoryItemsService.update(this.data.item!.id, payload)
      : this.inventoryItemsService.create(payload);

    request$.subscribe({
      next: (item) => this.dialogRef.close(item),
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
    this.categoriesService.list('INVENTORY').subscribe({ next: (categories) => this.categories.set(categories) });
  }

  private loadSuppliers(): void {
    this.suppliersService.list({ page: 1, limit: 100 }).subscribe({ next: (result) => this.suppliers.set(result.data) });
  }

  private buildPayload(): CreateInventoryItemPayload {
    const raw = this.form.getRawValue();

    return {
      name: raw.name.trim(),
      sku: raw.sku.trim() || undefined,
      description: raw.description.trim() || undefined,
      unit: raw.unit.trim() || 'UN',
      costPrice: raw.costPrice,
      salePrice: raw.salePrice,
      minimumStock: raw.minimumStock,
      initialQuantity: this.isEditMode ? undefined : raw.initialQuantity,
      location: raw.location.trim() || undefined,
      categoryId: raw.categoryId || undefined,
      supplierId: raw.supplierId || undefined,
    };
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 409) {
      return 'Já existe um item com esse SKU.';
    }

    if (error.status === 400) {
      const backendMessage = (error.error as { message?: string | string[] } | null)?.message;
      if (Array.isArray(backendMessage) && backendMessage.length > 0) {
        return backendMessage.join(' ');
      }
      if (typeof backendMessage === 'string') {
        return backendMessage;
      }
    }

    return 'Não foi possível salvar o item. Verifique os dados e tente novamente.';
  }
}
