import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/company-settings/company-settings').then((m) => m.CompanySettingsPage),
    title: 'Configurações — Empresa',
  },
  {
    path: 'preferences',
    loadComponent: () => import('./pages/preferences-settings/preferences-settings').then((m) => m.PreferencesSettingsPage),
    title: 'Configurações — Preferências',
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile-settings/profile-settings').then((m) => m.ProfileSettingsPage),
    title: 'Configurações — Meu Perfil',
  },
];
