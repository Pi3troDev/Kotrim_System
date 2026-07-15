import { Routes } from '@angular/router';
import { PagePlaceholder } from '../../shared/components/page-placeholder/page-placeholder';

export const CLIENTS_ROUTES: Routes = [
  {
    path: '',
    component: PagePlaceholder,
    data: { title: 'Clientes', icon: 'group' },
    title: 'Clientes',
  },
];
