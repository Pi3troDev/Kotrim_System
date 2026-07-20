import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmployeesService } from '../../services/employees.service';
import { Employee } from '../../interfaces/employee.interfaces';
import {
  EmployeeFormDialog,
  EmployeeFormDialogData,
} from '../../components/employee-form-dialog/employee-form-dialog';
import { ConfirmDialog, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog';

const DEFAULT_PAGE_SIZE = 20;

type ActiveFilter = '' | 'true' | 'false';

@Component({
  selector: 'app-employee-list',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.scss',
})
export class EmployeeList implements OnInit, OnDestroy {
  private readonly employeesService = inject(EmployeesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyed$ = new Subject<void>();

  readonly displayedColumns = ['name', 'position', 'contact', 'hiredAt', 'salary', 'status', 'actions'];
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly activeControl = new FormControl<ActiveFilter>('', { nonNullable: true });

  readonly employees = signal<Employee[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  ngOnInit(): void {
    this.load();

    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroyed$))
      .subscribe(() => {
        this.page.set(1);
        this.load();
      });

    this.activeControl.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    const activeValue = this.activeControl.value;

    this.employeesService
      .list({
        page: this.page(),
        limit: this.limit(),
        search: this.searchControl.value || undefined,
        isActive: activeValue === '' ? undefined : activeValue === 'true',
      })
      .subscribe({
        next: (result) => {
          this.employees.set(result.data);
          this.total.set(result.meta.total);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.hasError.set(true);
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.load();
  }

  openCreateDialog(): void {
    this.openFormDialog({});
  }

  openEditDialog(employee: Employee): void {
    this.openFormDialog({ employee });
  }

  confirmDelete(employee: Employee): void {
    const data: ConfirmDialogData = {
      title: 'Excluir funcionário',
      message: `Tem certeza que deseja excluir "${employee.name}"? Isso também encerra o lançamento de salário recorrente, se houver.`,
      confirmLabel: 'Excluir',
      danger: true,
    };

    this.dialog
      .open(ConfirmDialog, { data, width: '420px' })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;

        this.employeesService.remove(employee.id).subscribe({
          next: () => {
            this.snackBar.open('Funcionário excluído.', 'Fechar', { duration: 3000 });
            this.load();
          },
          error: () => this.snackBar.open('Não foi possível excluir o funcionário.', 'Fechar', { duration: 4000 }),
        });
      });
  }

  private openFormDialog(data: EmployeeFormDialogData): void {
    this.dialog
      .open(EmployeeFormDialog, { data, width: '520px' })
      .afterClosed()
      .subscribe((result: Employee | undefined) => {
        if (result) {
          this.load();
        }
      });
  }
}
