import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { APPOINTMENT_STATUS_META } from '../../../../shared/constants/appointment-status';
import { ConfirmDialog, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { EmployeesService } from '../../../employees/services/employees.service';
import { Employee } from '../../../employees/interfaces/employee.interfaces';
import { AppointmentsService } from '../../services/appointments.service';
import { Appointment } from '../../interfaces/appointment.interfaces';
import {
  AppointmentFormDialog,
  AppointmentFormDialogData,
} from '../../components/appointment-form-dialog/appointment-form-dialog';

@Component({
  selector: 'app-agenda-board',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './agenda-board.html',
  styleUrl: './agenda-board.scss',
})
export class AgendaBoard implements OnInit, OnDestroy {
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly employeesService = inject(EmployeesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyed$ = new Subject<void>();

  readonly displayedColumns = ['time', 'title', 'employee', 'linked', 'status', 'actions'];
  readonly employeeControl = new FormControl<string>('', { nonNullable: true });
  readonly statusMeta = APPOINTMENT_STATUS_META;

  readonly selectedDate = signal(this.startOfDay(new Date()));
  readonly employeeOptions = signal<Employee[]>([]);
  readonly appointments = signal<Appointment[]>([]);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  readonly isToday = computed(() => this.isSameDay(this.selectedDate(), new Date()));

  readonly dateLabel = computed(() => {
    const date = this.selectedDate();
    const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(date);

    if (this.isSameDay(date, new Date())) {
      return `Hoje, ${dayMonth}`;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (this.isSameDay(date, tomorrow)) {
      return `Amanhã, ${dayMonth}`;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (this.isSameDay(date, yesterday)) {
      return `Ontem, ${dayMonth}`;
    }

    const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date);
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedWeekday}, ${dayMonth}`;
  });

  ngOnInit(): void {
    this.load();

    this.employeesService.list({ page: 1, limit: 100, isActive: true }).subscribe({
      next: (result) => this.employeeOptions.set(result.data),
    });

    this.employeeControl.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    const from = this.startOfDay(this.selectedDate());
    const to = this.endOfDay(this.selectedDate());

    this.appointmentsService
      .list({
        page: 1,
        limit: 100,
        from: from.toISOString(),
        to: to.toISOString(),
        employeeId: this.employeeControl.value || undefined,
      })
      .subscribe({
        next: (result) => {
          this.appointments.set(result.data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.hasError.set(true);
        },
      });
  }

  employeeNames(appointment: Appointment): string {
    return appointment.employees.map((employee) => employee.name).join(', ');
  }

  goToPreviousDay(): void {
    this.shiftDay(-1);
  }

  goToNextDay(): void {
    this.shiftDay(1);
  }

  goToToday(): void {
    this.selectedDate.set(this.startOfDay(new Date()));
    this.load();
  }

  onDateChange(date: Date | null): void {
    if (!date) return;
    this.selectedDate.set(this.startOfDay(date));
    this.load();
  }

  openCreateDialog(): void {
    this.openFormDialog({ defaultDate: this.selectedDate() });
  }

  openEditDialog(appointment: Appointment): void {
    this.openFormDialog({ appointment });
  }

  confirmDelete(appointment: Appointment): void {
    const data: ConfirmDialogData = {
      title: 'Excluir compromisso',
      message: `Tem certeza que deseja excluir "${appointment.title}"?`,
      confirmLabel: 'Excluir',
      danger: true,
    };

    this.dialog
      .open(ConfirmDialog, { data, width: '420px' })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;

        this.appointmentsService.remove(appointment.id).subscribe({
          next: () => {
            this.snackBar.open('Compromisso excluído.', 'Fechar', { duration: 3000 });
            this.load();
          },
          error: () => this.snackBar.open('Não foi possível excluir o compromisso.', 'Fechar', { duration: 4000 }),
        });
      });
  }

  private openFormDialog(data: AppointmentFormDialogData): void {
    this.dialog
      .open(AppointmentFormDialog, { data, width: '560px' })
      .afterClosed()
      .subscribe((result: Appointment | undefined) => {
        if (result) {
          this.load();
        }
      });
  }

  private shiftDay(days: number): void {
    const next = new Date(this.selectedDate());
    next.setDate(next.getDate() + days);
    this.selectedDate.set(next);
    this.load();
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  private endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
}
