import { Routes } from '@angular/router';

export const FINANCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/expense-list/expense-list').then((m) => m.ExpenseList),
    title: 'Financeiro',
  },
  {
    path: 'income',
    loadComponent: () => import('./pages/income-list/income-list').then((m) => m.IncomeList),
    title: 'Receitas',
  },
];
