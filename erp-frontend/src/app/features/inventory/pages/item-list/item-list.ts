import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
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
import { ItemFormDialog, ItemFormDialogData } from '../../components/item-form-dialog/item-form-dialog';
import { StockMovementDialog } from '../../components/stock-movement-dialog/stock-movement-dialog';
import { CategoryManagerDialog } from '../../components/category-manager-dialog/category-manager-dialog';
import { InventoryItemsService } from '../../services/inventory-items.service';
import { InventoryItem } from '../../interfaces/inventory.interfaces';

const DEFAULT_PAGE_SIZE = 20;

@Component({
  selector: 'app-item-list',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    InventoryTabs,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './item-list.html',
  styleUrl: './item-list.scss',
})
export class ItemList implements OnInit, OnDestroy {
  private readonly inventoryItemsService = inject(InventoryItemsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyed$ = new Subject<void>();

  readonly displayedColumns = ['sku', 'name', 'category', 'quantity', 'salePrice', 'actions'];
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly lowStockOnly = signal(false);

  readonly items = signal<InventoryItem[]>([]);
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

    this.inventoryItemsService
      .list({
        page: this.page(),
        limit: this.limit(),
        search: this.searchControl.value || undefined,
        lowStockOnly: this.lowStockOnly() || undefined,
      })
      .subscribe({
        next: (result) => {
          this.items.set(result.data);
          this.total.set(result.meta.total);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.hasError.set(true);
        },
      });
  }

  toggleLowStockOnly(): void {
    this.lowStockOnly.update((value) => !value);
    this.page.set(1);
    this.load();
  }

  isLowStock(item: InventoryItem): boolean {
    return item.quantityInStock <= item.minimumStock;
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.load();
  }

  openCreateDialog(): void {
    this.openFormDialog({});
  }

  openEditDialog(item: InventoryItem): void {
    this.openFormDialog({ item });
  }

  openMovementDialog(item: InventoryItem): void {
    this.dialog
      .open(StockMovementDialog, { data: { item }, width: '440px' })
      .afterClosed()
      .subscribe((updated: InventoryItem | undefined) => {
        if (updated) this.load();
      });
  }

  openCategoryManager(): void {
    this.dialog
      .open(CategoryManagerDialog, { width: '440px' })
      .afterClosed()
      .subscribe((changed: boolean | undefined) => {
        if (changed) this.load();
      });
  }

  confirmDelete(item: InventoryItem): void {
    const data: ConfirmDialogData = {
      title: 'Excluir item',
      message: `Tem certeza que deseja excluir "${item.name}" do estoque?`,
      confirmLabel: 'Excluir',
      danger: true,
    };

    this.dialog
      .open(ConfirmDialog, { data, width: '420px' })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;

        this.inventoryItemsService.remove(item.id).subscribe({
          next: () => {
            this.snackBar.open('Item excluído.', 'Fechar', { duration: 3000 });
            this.load();
          },
          error: () => this.snackBar.open('Não foi possível excluir o item.', 'Fechar', { duration: 4000 }),
        });
      });
  }

  private openFormDialog(data: ItemFormDialogData): void {
    this.dialog
      .open(ItemFormDialog, { data, width: '560px' })
      .afterClosed()
      .subscribe((result: InventoryItem | undefined) => {
        if (result) this.load();
      });
  }
}
