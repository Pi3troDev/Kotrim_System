import { Routes } from '@angular/router';
import { PagePlaceholder } from '../../shared/components/page-placeholder/page-placeholder';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: PagePlaceholder,
    data: { title: 'Configurações', icon: 'settings' },
    title: 'Configurações',
  },
];
