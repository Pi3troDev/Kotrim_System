import { Routes } from '@angular/router';

export const CLIENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/client-list/client-list').then((m) => m.ClientList),
    title: 'Clientes',
  },
];
