import { Routes } from '@angular/router';
import { PagePlaceholder } from '../../shared/components/page-placeholder/page-placeholder';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    component: PagePlaceholder,
    data: { title: 'Relatórios', icon: 'bar_chart' },
    title: 'Relatórios',
  },
];
