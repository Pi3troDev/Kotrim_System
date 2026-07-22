import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged, filter, switchMap, takeUntil, tap } from 'rxjs';
import { APPOINTMENT_STATUS_META } from '../../../../shared/constants/appointment-status';
import { ClientsService } from '../../../clients/services/clients.service';
import { Client } from '../../../clients/interfaces/client.interfaces';
import { VehiclesService } from '../../../vehicles/services/vehicles.service';
import { Vehicle } from '../../../vehicles/interfaces/vehicle.interfaces';
import { EmployeesService } from '../../../employees/services/employees.service';
import { Employee } from '../../../employees/interfaces/employee.interfaces';
import { WorkOrdersService } from '../../../work-orders/services/work-orders.service';
import { WorkOrderListItem } from '../../../work-orders/interfaces/work-order.interfaces';
import { AppointmentsService } from '../../services/appointments.service';
import { Appointment, AppointmentStatus, CreateAppointmentPayload, UpdateAppointmentPayload } from '../../interfaces/appointment.interfaces';

type SelectedClient = Pick<Client, 'id' | 'name'>;

export interface AppointmentFormDialogData {
  appointment?: Appointment;
  defaultDate?: Date;
}

@Component({
  selector: 'app-appointment-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './appointment-form-dialog.html',
  styleUrl: './appointment-form-dialog.scss',
})
export class AppointmentFormDialog implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly clientsService = inject(ClientsService);
  private readonly vehiclesService = inject(VehiclesService);
  private readonly employeesService = inject(EmployeesService);
  private readonly workOrdersService = inject(WorkOrdersService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly dialogRef = inject(MatDialogRef<AppointmentFormDialog>);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<AppointmentFormDialogData>(MAT_DIALOG_DATA);

  readonly isEditMode = !!this.data.appointment;
  readonly isSubmitting = signal(false);
  readonly statusOptions = Object.keys(APPOINTMENT_STATUS_META) as AppointmentStatus[];
  readonly statusMeta = APPOINTMENT_STATUS_META;

  readonly employeeOptions = signal<Employee[]>([]);
  readonly clientOptions = signal<Client[]>([]);
  readonly isSearchingClients = signal(false);
  readonly selectedClientId = signal<string | null>(this.data.appointment?.clientId ?? null);
  readonly vehicleOptions = signal<Vehicle[]>([]);
  readonly isLoadingVehicles = signal(false);
  readonly workOrderOptions = signal<WorkOrderListItem[]>([]);
  readonly isLoadingWorkOrders = signal(false);

  private readonly destroyed$ = new Subject<void>();

  readonly clientSearchControl = this.fb.nonNullable.control<SelectedClient | string>(
    this.data.appointment?.client ? { id: this.data.appointment.client.id, name: this.data.appointment.client.name } : '',
  );

  readonly form = this.fb.nonNullable.group({
    employeeIds: this.fb.nonNullable.control<string[]>(
      this.data.appointment?.employees.map((employee) => employee.id) ?? [],
      [Validators.required, Validators.minLength(1)],
    ),
    vehicleId: [this.data.appointment?.vehicleId ?? ''],
    workOrderId: [this.data.appointment?.workOrderId ?? ''],
    title: [this.data.appointment?.title ?? '', [Validators.required, Validators.minLength(2)]],
    description: [this.data.appointment?.description ?? ''],
    scheduledDate: this.fb.nonNullable.control<Date>(
      this.data.appointment ? new Date(this.data.appointment.scheduledStart) : (this.data.defaultDate ?? new Date()),
      Validators.required,
    ),
    startTime: [this.data.appointment ? this.toTimeString(this.data.appointment.scheduledStart) : '09:00', Validators.required],
    endTime: [this.data.appointment ? this.toTimeString(this.data.appointment.scheduledEnd) : '10:00', Validators.required],
    notes: [this.data.appointment?.notes ?? ''],
    status: this.fb.nonNullable.control<AppointmentStatus>(this.data.appointment?.status ?? 'SCHEDULED'),
  });

  readonly displayClient = (value: SelectedClient | string): string =>
    typeof value === 'string' ? value : (value?.name ?? '');

  constructor() {
    this.clientSearchControl.valueChanges
      .pipe(
        tap((value) => {
          const clientId = typeof value === 'string' ? null : (value?.id ?? null);
          this.selectedClientId.set(clientId);
          this.form.patchValue({ vehicleId: '', workOrderId: '' });
          this.vehicleOptions.set([]);
          this.workOrderOptions.set([]);
          if (clientId) {
            this.loadVehiclesForClient(clientId);
            this.loadWorkOrdersForClient(clientId);
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

  ngOnInit(): void {
    this.employeesService.list({ page: 1, limit: 100, isActive: true }).subscribe({
      next: (result) => this.employeeOptions.set(result.data),
    });

    // Edit mode: the client control starts pre-filled but valueChanges never fires for an initial
    // value, so the vehicle/work-order option lists (and the pre-selected ids) need an explicit load.
    if (this.isEditMode && this.selectedClientId()) {
      this.loadVehiclesForClient(this.selectedClientId()!);
      this.loadWorkOrdersForClient(this.selectedClientId()!);
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const scheduledStart = this.combineDateTime(raw.scheduledDate, raw.startTime);
    const scheduledEnd = this.combineDateTime(raw.scheduledDate, raw.endTime);

    if (new Date(scheduledEnd) <= new Date(scheduledStart)) {
      this.snackBar.open('O horário de término deve ser depois do horário de início.', 'Fechar', { duration: 5000 });
      return;
    }

    this.isSubmitting.set(true);
    const basePayload: CreateAppointmentPayload = {
      employeeIds: raw.employeeIds,
      clientId: this.selectedClientId() ?? undefined,
      vehicleId: raw.vehicleId || undefined,
      workOrderId: raw.workOrderId || undefined,
      title: raw.title.trim(),
      description: raw.description.trim() || undefined,
      scheduledStart,
      scheduledEnd,
      notes: raw.notes.trim() || undefined,
    };

    const request$ = this.isEditMode
      ? this.appointmentsService.update(this.data.appointment!.id, { ...basePayload, status: raw.status } as UpdateAppointmentPayload)
      : this.appointmentsService.create(basePayload);

    request$.subscribe({
      next: (appointment) => this.dialogRef.close(appointment),
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.snackBar.open(this.resolveErrorMessage(error), 'Fechar', { duration: 6000 });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  /** Snapshot, not a live rule: whoever is active right now gets assigned — someone hired later isn't retroactively added. */
  selectAllEmployees(): void {
    this.form.controls.employeeIds.setValue(this.employeeOptions().map((employee) => employee.id));
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

  private loadWorkOrdersForClient(clientId: string): void {
    this.isLoadingWorkOrders.set(true);
    this.workOrdersService.list({ page: 1, limit: 50, clientId }).subscribe({
      next: (result) => {
        this.workOrderOptions.set(result.data);
        this.isLoadingWorkOrders.set(false);
      },
      error: () => this.isLoadingWorkOrders.set(false),
    });
  }

  private combineDateTime(date: Date, time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0).toISOString();
  }

  private toTimeString(iso: string): string {
    const date = new Date(iso);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
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

    return 'Não foi possível salvar o compromisso. Verifique os dados e tente novamente.';
  }
}
