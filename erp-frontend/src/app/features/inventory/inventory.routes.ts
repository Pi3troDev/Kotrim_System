import { Routes } from '@angular/router';
import { PagePlaceholder } from '../../shared/components/page-placeholder/page-placeholder';

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    component: PagePlaceholder,
    data: { title: 'Estoque', icon: 'inventory_2' },
    title: 'Estoque',
  },
];
