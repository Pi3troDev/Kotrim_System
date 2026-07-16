import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DigitMaskDirective } from '../../../../shared/directives/digit-mask.directive';
import { BRAZILIAN_STATES } from '../../../../shared/constants/brazilian-states';
import { ClientsService } from '../../services/clients.service';
import { Client, CreateClientPayload } from '../../interfaces/client.interfaces';

export interface ClientFormDialogData {
  client?: Client;
}

@Component({
  selector: 'app-client-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DigitMaskDirective,
  ],
  templateUrl: './client-form-dialog.html',
  styleUrl: './client-form-dialog.scss',
})
export class ClientFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly clientsService = inject(ClientsService);
  private readonly dialogRef = inject(MatDialogRef<ClientFormDialog>);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<ClientFormDialogData>(MAT_DIALOG_DATA);

  readonly isEditMode = !!this.data.client;
  readonly isSubmitting = signal(false);
  readonly brazilianStates = BRAZILIAN_STATES;

  readonly form = this.fb.nonNullable.group({
    name: [this.data.client?.name ?? '', [Validators.required, Validators.minLength(2)]],
    document: [this.data.client?.document ?? ''],
    email: [this.data.client?.email ?? '', [Validators.email]],
    phone: [this.data.client?.phone ?? ''],
    address: [this.data.client?.address ?? ''],
    city: [this.data.client?.city ?? ''],
    state: [this.data.client?.state ?? ''],
    zipCode: [this.data.client?.zipCode ?? ''],
    notes: [this.data.client?.notes ?? ''],
  });

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const payload = this.buildPayload();

    const request$ = this.isEditMode
      ? this.clientsService.update(this.data.client!.id, payload)
      : this.clientsService.create(payload);

    request$.subscribe({
      next: (client) => this.dialogRef.close(client),
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.snackBar.open(this.resolveErrorMessage(error), 'Fechar', { duration: 6000 });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private buildPayload(): CreateClientPayload {
    const raw = this.form.getRawValue();
    const optional: Record<string, string | undefined> = {};

    for (const key of ['document', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'notes'] as const) {
      optional[key] = raw[key]?.trim() ? raw[key] : undefined;
    }

    return { name: raw.name, ...optional };
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 409) {
      return 'Já existe um cliente com esse CPF/CNPJ.';
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

    return 'Não foi possível salvar o cliente. Verifique os dados e tente novamente.';
  }
}
