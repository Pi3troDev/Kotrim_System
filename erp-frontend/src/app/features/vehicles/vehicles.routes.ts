import { Routes } from '@angular/router';
import { PagePlaceholder } from '../../shared/components/page-placeholder/page-placeholder';

export const VEHICLES_ROUTES: Routes = [
  {
    path: '',
    component: PagePlaceholder,
    data: { title: 'Veículos', icon: 'directions_car' },
    title: 'Veículos',
  },
];
