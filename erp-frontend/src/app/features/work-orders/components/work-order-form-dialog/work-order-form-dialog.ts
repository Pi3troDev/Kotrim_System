import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged, filter, switchMap, takeUntil, tap } from 'rxjs';
import { ClientsService } from '../../../clients/services/clients.service';
import { Client } from '../../../clients/interfaces/client.interfaces';
import { VehiclesService } from '../../../vehicles/services/vehicles.service';
import { Vehicle } from '../../../vehicles/interfaces/vehicle.interfaces';
import { WorkOrdersService } from '../../services/work-orders.service';
import { WorkOrder } from '../../interfaces/work-order.interfaces';

type SelectedClient = Pick<Client, 'id' | 'name'>;

@Component({
  selector: 'app-work-order-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './work-order-form-dialog.html',
  styleUrl: './work-order-form-dialog.scss',
})
export class WorkOrderFormDialog implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly clientsService = inject(ClientsService);
  private readonly vehiclesService = inject(VehiclesService);
  private readonly workOrdersService = inject(WorkOrdersService);
  private readonly dialogRef = inject(MatDialogRef<WorkOrderFormDialog>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyed$ = new Subject<void>();

  readonly isSubmitting = signal(false);
  readonly clientOptions = signal<Client[]>([]);
  readonly isSearchingClients = signal(false);
  readonly selectedClientId = signal<string | null>(null);
  readonly vehicleOptions = signal<Vehicle[]>([]);
  readonly isLoadingVehicles = signal(false);

  readonly clientSearchControl = this.fb.nonNullable.control<SelectedClient | string>('');

  readonly form = this.fb.nonNullable.group({
    vehicleId: ['', Validators.required],
    reportedProblem: ['', [Validators.required, Validators.minLength(3)]],
  });

  readonly displayClient = (value: SelectedClient | string): string =>
    typeof value === 'string' ? value : (value?.name ?? '');

  constructor() {
    this.clientSearchControl.valueChanges
      .pipe(
        tap((value) => {
          const clientId = typeof value === 'string' ? null : (value?.id ?? null);
          this.selectedClientId.set(clientId);
          this.form.patchValue({ vehicleId: '' });
          this.vehicleOptions.set([]);
          if (clientId) {
            this.loadVehiclesForClient(clientId);
          }
        }),
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
    const raw = this.form.getRawValue();

    this.workOrdersService
      .create({
        clientId: this.selectedClientId()!,
        vehicleId: raw.vehicleId,
        reportedProblem: raw.reportedProblem.trim(),
      })
      .subscribe({
        next: (workOrder: WorkOrder) => this.dialogRef.close(workOrder),
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.snackBar.open(this.resolveErrorMessage(error), 'Fechar', { duration: 6000 });
        },
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private loadVehiclesForClient(clientId: string): void {
    this.isLoadingVehicles.set(true);
    this.vehiclesService.list({ page: 1, limit: 50, clientId }).subscribe({
      next: (result) => {
        this.vehicleOptions.set(result.data);
        this.isLoadingVehicles.set(false);
      },
      error: () => this.isLoadingVehicles.set(false),
    });
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

    return 'Não foi possível criar a ordem de serviço. Verifique os dados e tente novamente.';
  }
}
