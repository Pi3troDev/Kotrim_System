import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DigitMaskDirective } from '../../../../shared/directives/digit-mask.directive';
import { SuppliersService } from '../../services/suppliers.service';
import { CreateSupplierPayload, Supplier } from '../../interfaces/inventory.interfaces';

export interface SupplierFormDialogData {
  supplier?: Supplier;
}

@Component({
  selector: 'app-supplier-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DigitMaskDirective,
  ],
  templateUrl: './supplier-form-dialog.html',
  styleUrl: './supplier-form-dialog.scss',
})
export class SupplierFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly suppliersService = inject(SuppliersService);
  private readonly dialogRef = inject(MatDialogRef<SupplierFormDialog>);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<SupplierFormDialogData>(MAT_DIALOG_DATA);

  readonly isEditMode = !!this.data.supplier;
  readonly isSubmitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: [this.data.supplier?.name ?? '', [Validators.required, Validators.minLength(2)]],
    document: [this.data.supplier?.document ?? ''],
    email: [this.data.supplier?.email ?? '', [Validators.email]],
    phone: [this.data.supplier?.phone ?? ''],
    address: [this.data.supplier?.address ?? ''],
    notes: [this.data.supplier?.notes ?? ''],
  });

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const payload = this.buildPayload();

    const request$ = this.isEditMode
      ? this.suppliersService.update(this.data.supplier!.id, payload)
      : this.suppliersService.create(payload);

    request$.subscribe({
      next: (supplier) => this.dialogRef.close(supplier),
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.snackBar.open(this.resolveErrorMessage(error), 'Fechar', { duration: 6000 });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private buildPayload(): CreateSupplierPayload {
    const raw = this.form.getRawValue();
    const optional: Record<string, string | undefined> = {};

    for (const key of ['document', 'email', 'phone', 'address', 'notes'] as const) {
      optional[key] = raw[key]?.trim() ? raw[key] : undefined;
    }

    return { name: raw.name, ...optional };
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 409) {
      return 'Já existe um fornecedor com esse CPF/CNPJ.';
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

    return 'Não foi possível salvar o fornecedor. Verifique os dados e tente novamente.';
  }
}
