import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    // The dashboard is now the landing screen of the panel: the numbers come
    // first, the company list is where you go to act on one of them.
    path: '',
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboardPage),
    title: 'Painel Kotrim',
  },
  {
    path: 'companies',
    loadComponent: () => import('./pages/admin-companies/admin-companies').then((m) => m.AdminCompaniesPage),
    title: 'Empresas — Painel Kotrim',
  },
  {
    path: 'mail-logs',
    loadComponent: () => import('./pages/admin-mail-logs/admin-mail-logs').then((m) => m.AdminMailLogsPage),
    title: 'Comunicações — Painel Kotrim',
  },
  {
    path: 'health',
    loadComponent: () => import('./pages/admin-health/admin-health').then((m) => m.AdminHealthPage),
    title: 'Saúde do sistema — Painel Kotrim',
  },
];
