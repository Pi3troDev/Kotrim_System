import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged, filter, switchMap, takeUntil, tap } from 'rxjs';
import { ClientsService } from '../../../clients/services/clients.service';
import { Client } from '../../../clients/interfaces/client.interfaces';
import { VehiclesService } from '../../services/vehicles.service';
import { CreateVehiclePayload, Vehicle } from '../../interfaces/vehicle.interfaces';

export interface VehicleFormDialogData {
  vehicle?: Vehicle;
}

/** What the client autocomplete control holds: free text while searching, or the picked client once selected. */
type SelectedClient = Pick<Client, 'id' | 'name'>;

const CURRENT_YEAR = new Date().getFullYear();

@Component({
  selector: 'app-vehicle-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './vehicle-form-dialog.html',
  styleUrl: './vehicle-form-dialog.scss',
})
export class VehicleFormDialog implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly clientsService = inject(ClientsService);
  private readonly vehiclesService = inject(VehiclesService);
  private readonly dialogRef = inject(MatDialogRef<VehicleFormDialog>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyed$ = new Subject<void>();
  readonly data = inject<VehicleFormDialogData>(MAT_DIALOG_DATA);

  readonly isEditMode = !!this.data.vehicle;
  readonly isSubmitting = signal(false);
  readonly clientOptions = signal<Client[]>([]);
  readonly isSearchingClients = signal(false);
  readonly currentYear = CURRENT_YEAR;

  readonly selectedClientId = signal<string | null>(this.data.vehicle?.clientId ?? null);

  readonly clientSearchControl = this.fb.nonNullable.control<SelectedClient | string>(
    this.data.vehicle ? { id: this.data.vehicle.clientId, name: this.data.vehicle.client.name } : '',
  );

  readonly displayClient = (value: SelectedClient | string): string =>
    typeof value === 'string' ? value : (value?.name ?? '');

  readonly form = this.fb.nonNullable.group({
    plate: [this.data.vehicle?.plate ?? '', [Validators.required, Validators.minLength(7), Validators.maxLength(8)]],
    brand: [this.data.vehicle?.brand ?? '', [Validators.required, Validators.minLength(1)]],
    model: [this.data.vehicle?.model ?? '', [Validators.required, Validators.minLength(1)]],
    year: [this.data.vehicle?.year ?? null],
    color: [this.data.vehicle?.color ?? ''],
    chassisNumber: [this.data.vehicle?.chassisNumber ?? ''],
    mileage: [this.data.vehicle?.mileage ?? null],
    notes: [this.data.vehicle?.notes ?? ''],
  });

  constructor() {
    // Material's autocomplete pushes the raw selected object through this control's
    // onChange (not just a display string), so a non-string emission means the user
    // just picked an option — capture its id and skip the search branch entirely.
    this.clientSearchControl.valueChanges
      .pipe(
        tap((value) => this.selectedClientId.set(typeof value === 'string' ? null : (value?.id ?? null))),
        filter((value): value is string => typeof value === 'string'),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          this.isSearchingClients.set(true);
          return this.clientsService.list({ page: 1, limit: 10, search: term || undefined });
        }),
        takeUntil(this.destroyed$),
      )
      .subscribe({
        next: (result) => {
          this.clientOptions.set(result.data);
          this.isSearchingClients.set(false);
        },
        error: () => this.isSearchingClients.set(false),
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  submit(): void {
    if (this.form.invalid || !this.selectedClientId() || this.isSubmitting()) {
      this.form.markAllAsTouched();
      this.clientSearchControl.markAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const payload = this.buildPayload();

    const request$ = this.isEditMode
      ? this.vehiclesService.update(this.data.vehicle!.id, payload)
      : this.vehiclesService.create(payload);

    request$.subscribe({
      next: (vehicle) => this.dialogRef.close(vehicle),
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.snackBar.open(this.resolveErrorMessage(error), 'Fechar', { duration: 6000 });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private buildPayload(): CreateVehiclePayload {
    const raw = this.form.getRawValue();
    const optional: Record<string, string | number | undefined> = {};

    for (const key of ['color', 'chassisNumber', 'notes'] as const) {
      optional[key] = raw[key]?.trim() ? raw[key] : undefined;
    }

    return {
      clientId: this.selectedClientId()!,
      plate: raw.plate.trim().toUpperCase(),
      brand: raw.brand.trim(),
      model: raw.model.trim(),
      year: raw.year ?? undefined,
      mileage: raw.mileage ?? undefined,
      ...optional,
    };
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 409) {
      return 'Já existe um veículo cadastrado com essa placa.';
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

    return 'Não foi possível salvar o veículo. Verifique os dados e tente novamente.';
  }
}
