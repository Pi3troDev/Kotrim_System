import { Routes } from '@angular/router';
import { PagePlaceholder } from '../../shared/components/page-placeholder/page-placeholder';

export const EMPLOYEES_ROUTES: Routes = [
  {
    path: '',
    component: PagePlaceholder,
    data: { title: 'Funcionários', icon: 'badge' },
    title: 'Funcionários',
  },
];
