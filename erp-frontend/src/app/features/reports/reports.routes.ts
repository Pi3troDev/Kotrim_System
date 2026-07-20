import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/finance-report/finance-report').then((m) => m.FinanceReportPage),
    title: 'Relatório Financeiro',
  },
  {
    path: 'work-orders',
    loadComponent: () => import('./pages/work-orders-report/work-orders-report').then((m) => m.WorkOrdersReportPage),
    title: 'Relatório de Ordens de Serviço',
  },
  {
    path: 'inventory',
    loadComponent: () => import('./pages/inventory-report/inventory-report').then((m) => m.InventoryReportPage),
    title: 'Relatório de Estoque',
  },
];
