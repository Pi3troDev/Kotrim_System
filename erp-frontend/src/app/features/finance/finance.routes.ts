import { Routes } from '@angular/router';
import { PagePlaceholder } from '../../shared/components/page-placeholder/page-placeholder';

export const FINANCE_ROUTES: Routes = [
  {
    path: '',
    component: PagePlaceholder,
    data: { title: 'Financeiro', icon: 'payments' },
    title: 'Financeiro',
  },
];
