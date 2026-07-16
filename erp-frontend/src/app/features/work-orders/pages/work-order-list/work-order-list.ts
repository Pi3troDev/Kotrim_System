import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WORK_ORDER_STATUS_META } from '../../../../shared/constants/work-order-status';
import { ConfirmDialog, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { WorkOrdersService } from '../../services/work-orders.service';
import { WorkOrderListItem, WorkOrderStatus } from '../../interfaces/work-order.interfaces';
import { WorkOrderFormDialog } from '../../components/work-order-form-dialog/work-order-form-dialog';

const DEFAULT_PAGE_SIZE = 20;

@Component({
  selector: 'app-work-order-list',
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
    MatProgressSpinnerModule,
  ],
  templateUrl: './work-order-list.html',
  styleUrl: './work-order-list.scss',
})
export class WorkOrderList implements OnInit, OnDestroy {
  private readonly workOrdersService = inject(WorkOrdersService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyed$ = new Subject<void>();

  readonly displayedColumns = ['number', 'client', 'vehicle', 'status', 'total', 'openedAt', 'actions'];
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<WorkOrderStatus | ''>('', { nonNullable: true });
  readonly statusMeta = WORK_ORDER_STATUS_META;
  readonly statusOptions = Object.keys(WORK_ORDER_STATUS_META) as WorkOrderStatus[];

  readonly workOrders = signal<WorkOrderListItem[]>([]);
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

    this.statusControl.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(() => {
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

    this.workOrdersService
      .list({
        page: this.page(),
        limit: this.limit(),
        search: this.searchControl.value || undefined,
        status: this.statusControl.value || undefined,
      })
      .subscribe({
        next: (result) => {
          this.workOrders.set(result.data);
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

  openDetail(workOrder: WorkOrderListItem): void {
    this.router.navigate(['/work-orders', workOrder.id]);
  }

  openCreateDialog(): void {
    this.dialog
      .open(WorkOrderFormDialog, { width: '520px' })
      .afterClosed()
      .subscribe((created: WorkOrderListItem | undefined) => {
        if (created) {
          this.router.navigate(['/work-orders', created.id]);
        }
      });
  }

  confirmDelete(workOrder: WorkOrderListItem, event: Event): void {
    event.stopPropagation();

    const data: ConfirmDialogData = {
      title: 'Excluir ordem de serviço',
      message: `Tem certeza que deseja excluir a OS #${workOrder.number}? Essa ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      danger: true,
    };

    this.dialog
      .open(ConfirmDialog, { data, width: '420px' })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;

        this.workOrdersService.remove(workOrder.id).subscribe({
          next: () => {
            this.snackBar.open('Ordem de serviço excluída.', 'Fechar', { duration: 3000 });
            this.load();
          },
          error: () => this.snackBar.open('Não foi possível excluir a ordem de serviço.', 'Fechar', { duration: 4000 }),
        });
      });
  }
}
