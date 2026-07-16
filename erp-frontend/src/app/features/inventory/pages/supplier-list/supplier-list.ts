import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
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
import { ConfirmDialog, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { InventoryTabs } from '../../components/inventory-tabs/inventory-tabs';
import { SupplierFormDialog, SupplierFormDialogData } from '../../components/supplier-form-dialog/supplier-form-dialog';
import { SuppliersService } from '../../services/suppliers.service';
import { Supplier } from '../../interfaces/inventory.interfaces';

const DEFAULT_PAGE_SIZE = 20;

@Component({
  selector: 'app-supplier-list',
  imports: [
    ReactiveFormsModule,
    InventoryTabs,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.scss',
})
export class SupplierList implements OnInit, OnDestroy {
  private readonly suppliersService = inject(SuppliersService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyed$ = new Subject<void>();

  readonly displayedColumns = ['name', 'document', 'contact', 'actions'];
  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly suppliers = signal<Supplier[]>([]);
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

    this.suppliersService
      .list({ page: this.page(), limit: this.limit(), search: this.searchControl.value || undefined })
      .subscribe({
        next: (result) => {
          this.suppliers.set(result.data);
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

  openEditDialog(supplier: Supplier): void {
    this.openFormDialog({ supplier });
  }

  confirmDelete(supplier: Supplier): void {
    const data: ConfirmDialogData = {
      title: 'Excluir fornecedor',
      message: `Tem certeza que deseja excluir "${supplier.name}"?`,
      confirmLabel: 'Excluir',
      danger: true,
    };

    this.dialog
      .open(ConfirmDialog, { data, width: '420px' })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;

        this.suppliersService.remove(supplier.id).subscribe({
          next: () => {
            this.snackBar.open('Fornecedor excluído.', 'Fechar', { duration: 3000 });
            this.load();
          },
          error: () => this.snackBar.open('Não foi possível excluir o fornecedor.', 'Fechar', { duration: 4000 }),
        });
      });
  }

  private openFormDialog(data: SupplierFormDialogData): void {
    this.dialog
      .open(SupplierFormDialog, { data, width: '520px' })
      .afterClosed()
      .subscribe((result: Supplier | undefined) => {
        if (result) this.load();
      });
  }
}
