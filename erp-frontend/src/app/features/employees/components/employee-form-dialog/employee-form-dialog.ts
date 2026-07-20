import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DigitMaskDirective } from '../../../../shared/directives/digit-mask.directive';
import { EmployeesService } from '../../services/employees.service';
import { CreateEmployeePayload, Employee, UpdateEmployeePayload } from '../../interfaces/employee.interfaces';

export interface EmployeeFormDialogData {
  employee?: Employee;
}

@Component({
  selector: 'app-employee-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DigitMaskDirective,
  ],
  templateUrl: './employee-form-dialog.html',
  styleUrl: './employee-form-dialog.scss',
})
export class EmployeeFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly employeesService = inject(EmployeesService);
  private readonly dialogRef = inject(MatDialogRef<EmployeeFormDialog>);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<EmployeeFormDialogData>(MAT_DIALOG_DATA);

  readonly isEditMode = !!this.data.employee;
  readonly isSubmitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: [this.data.employee?.name ?? '', [Validators.required, Validators.minLength(2)]],
    document: [this.data.employee?.document ?? ''],
    position: [this.data.employee?.position ?? ''],
    specialty: [this.data.employee?.specialty ?? ''],
    phone: [this.data.employee?.phone ?? ''],
    email: [this.data.employee?.email ?? '', [Validators.email]],
    hiredAt: this.fb.control<Date | null>(this.data.employee?.hiredAt ? new Date(this.data.employee.hiredAt) : null),
    salary: [this.data.employee?.salary ?? 0, [Validators.min(0)]],
    isActive: [this.data.employee?.isActive ?? true],
  });

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const payload = this.buildPayload();

    const request$ = this.isEditMode
      ? this.employeesService.update(this.data.employee!.id, payload)
      : this.employeesService.create(payload);

    request$.subscribe({
      next: (employee) => this.dialogRef.close(employee),
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.snackBar.open(this.resolveErrorMessage(error), 'Fechar', { duration: 6000 });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private buildPayload(): CreateEmployeePayload & Partial<UpdateEmployeePayload> {
    const raw = this.form.getRawValue();
    const optional: Record<string, string | undefined> = {};

    for (const key of ['document', 'position', 'specialty', 'phone', 'email'] as const) {
      optional[key] = raw[key]?.trim() ? raw[key] : undefined;
    }

    return {
      name: raw.name,
      ...optional,
      hiredAt: raw.hiredAt ? this.toIsoDate(raw.hiredAt) : undefined,
      salary: raw.salary || undefined,
      ...(this.isEditMode && { isActive: raw.isActive }),
    };
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 409) {
      return 'Já existe um funcionário com esse CPF/CNPJ.';
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

    return 'Não foi possível salvar o funcionário. Verifique os dados e tente novamente.';
  }
}
