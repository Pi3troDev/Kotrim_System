import { Routes } from '@angular/router';

export const WORK_ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/work-order-list/work-order-list').then((m) => m.WorkOrderList),
    title: 'Ordens de Serviço',
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/work-order-detail/work-order-detail').then((m) => m.WorkOrderDetail),
    title: 'Ordem de Serviço',
  },
];
