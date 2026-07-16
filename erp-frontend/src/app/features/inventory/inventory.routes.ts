import { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/item-list/item-list').then((m) => m.ItemList),
    title: 'Estoque',
  },
  {
    path: 'suppliers',
    loadComponent: () => import('./pages/supplier-list/supplier-list').then((m) => m.SupplierList),
    title: 'Fornecedores',
  },
];
