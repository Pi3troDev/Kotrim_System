import { Routes } from '@angular/router';
import { PagePlaceholder } from '../../shared/components/page-placeholder/page-placeholder';

export const WORK_ORDERS_ROUTES: Routes = [
  {
    path: '',
    component: PagePlaceholder,
    data: { title: 'Ordens de Serviço', icon: 'build' },
    title: 'Ordens de Serviço',
  },
];
