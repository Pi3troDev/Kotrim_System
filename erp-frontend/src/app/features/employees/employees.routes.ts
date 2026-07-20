import { Routes } from '@angular/router';

export const EMPLOYEES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/employee-list/employee-list').then((m) => m.EmployeeList),
    title: 'Funcionários',
  },
];
