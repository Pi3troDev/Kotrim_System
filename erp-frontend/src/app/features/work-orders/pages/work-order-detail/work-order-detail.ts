import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WORK_ORDER_STATUS_META, WORK_ORDER_TERMINAL_STATUSES } from '../../../../shared/constants/work-order-status';
import { ConfirmDialog, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { WorkOrdersService } from '../../services/work-orders.service';
import { WorkOrder, WorkOrderItem } from '../../interfaces/work-order.interfaces';
import { WorkOrderStatusDialog } from '../../components/work-order-status-dialog/work-order-status-dialog';
import { WorkOrderDetailsDialog } from '../../components/work-order-details-dialog/work-order-details-dialog';
import { WorkOrderItemDialog } from '../../components/work-order-item-dialog/work-order-item-dialog';

@Component({
  selector: 'app-work-order-detail',
  imports: [CurrencyPipe, DatePipe, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './work-order-detail.html',
  styleUrl: './work-order-detail.scss',
})
export class WorkOrderDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workOrdersService = inject(WorkOrdersService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly statusMeta = WORK_ORDER_STATUS_META;
  readonly workOrder = signal<WorkOrder | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  readonly isTerminal = computed(() => {
    const wo = this.workOrder();
    return !!wo && (WORK_ORDER_TERMINAL_STATUSES as readonly string[]).includes(wo.status);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.hasError.set(true);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.hasError.set(false);

    this.workOrdersService.get(id).subscribe({
      next: (workOrder) => {
        this.workOrder.set(workOrder);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/work-orders']);
  }

  openStatusDialog(): void {
    const workOrder = this.workOrder();
    if (!workOrder) return;

    this.dialog
      .open(WorkOrderStatusDialog, { data: { workOrderId: workOrder.id, currentStatus: workOrder.status }, width: '440px' })
      .afterClosed()
      .subscribe((updated: WorkOrder | undefined) => {
        if (updated) this.workOrder.set(updated);
      });
  }

  openDetailsDialog(): void {
    const workOrder = this.workOrder();
    if (!workOrder) return;

    this.dialog
      .open(WorkOrderDetailsDialog, { data: { workOrder }, width: '540px' })
      .afterClosed()
      .subscribe((updated: WorkOrder | undefined) => {
        if (updated) this.workOrder.set(updated);
      });
  }

  openAddItemDialog(): void {
    const workOrder = this.workOrder();
    if (!workOrder) return;

    this.dialog
      .open(WorkOrderItemDialog, { data: { workOrderId: workOrder.id }, width: '440px' })
      .afterClosed()
      .subscribe((updated: WorkOrder | undefined) => {
        if (updated) this.workOrder.set(updated);
      });
  }

  openEditItemDialog(item: WorkOrderItem): void {
    const workOrder = this.workOrder();
    if (!workOrder) return;

    this.dialog
      .open(WorkOrderItemDialog, { data: { workOrderId: workOrder.id, item }, width: '440px' })
      .afterClosed()
      .subscribe((updated: WorkOrder | undefined) => {
        if (updated) this.workOrder.set(updated);
      });
  }

  confirmRemoveItem(item: WorkOrderItem): void {
    const workOrder = this.workOrder();
    if (!workOrder) return;

    const data: ConfirmDialogData = {
      title: 'Remover item',
      message: `Remover "${item.description}" desta ordem de serviço?`,
      confirmLabel: 'Remover',
      danger: true,
    };

    this.dialog
      .open(ConfirmDialog, { data, width: '420px' })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;

        this.workOrdersService.removeItem(workOrder.id, item.id).subscribe({
          next: (updated) => {
            this.workOrder.set(updated);
            this.snackBar.open('Item removido.', 'Fechar', { duration: 3000 });
          },
          error: () => this.snackBar.open('Não foi possível remover o item.', 'Fechar', { duration: 4000 }),
        });
      });
  }

  confirmDelete(): void {
    const workOrder = this.workOrder();
    if (!workOrder) return;

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
            this.router.navigate(['/work-orders']);
          },
          error: () => this.snackBar.open('Não foi possível excluir a ordem de serviço.', 'Fechar', { duration: 4000 }),
        });
      });
  }
}
