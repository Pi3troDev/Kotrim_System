import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VehiclesService } from '../../services/vehicles.service';
import { Vehicle } from '../../interfaces/vehicle.interfaces';
import {
  VehicleFormDialog,
  VehicleFormDialogData,
} from '../../components/vehicle-form-dialog/vehicle-form-dialog';
import { ConfirmDialog, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog';

const DEFAULT_PAGE_SIZE = 20;

@Component({
  selector: 'app-vehicle-list',
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './vehicle-list.html',
  styleUrl: './vehicle-list.scss',
})
export class VehicleList implements OnInit, OnDestroy {
  private readonly vehiclesService = inject(VehiclesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyed$ = new Subject<void>();

  readonly displayedColumns = ['plate', 'vehicle', 'client', 'year', 'mileage', 'actions'];
  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly vehicles = signal<Vehicle[]>([]);
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
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.vehiclesService
      .list({ page: this.page(), limit: this.limit(), search: this.searchControl.value || undefined })
      .subscribe({
        next: (result) => {
          this.vehicles.set(result.data);
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

  openEditDialog(vehicle: Vehicle): void {
    this.openFormDialog({ vehicle });
  }

  confirmDelete(vehicle: Vehicle): void {
    const data: ConfirmDialogData = {
      title: 'Excluir veículo',
      message: `Tem certeza que deseja excluir o veículo de placa "${vehicle.plate}"? Essa ação não afeta ordens de serviço já registradas.`,
      confirmLabel: 'Excluir',
      danger: true,
    };

    this.dialog
      .open(ConfirmDialog, { data, width: '420px' })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;

        this.vehiclesService.remove(vehicle.id).subscribe({
          next: () => {
            this.snackBar.open('Veículo excluído.', 'Fechar', { duration: 3000 });
            this.load();
          },
          error: () => this.snackBar.open('Não foi possível excluir o veículo.', 'Fechar', { duration: 4000 }),
        });
      });
  }

  private openFormDialog(data: VehicleFormDialogData): void {
    this.dialog
      .open(VehicleFormDialog, { data, width: '560px' })
      .afterClosed()
      .subscribe((result: Vehicle | undefined) => {
        if (result) {
          this.load();
        }
      });
  }
}
