import { Routes } from '@angular/router';
import { planFeatureGuard } from '../../core/guards/plan-feature.guard';

export const SETTINGS_ROUTES: Routes = [
  {
    // Personal, not company, settings — the sensible thing for every login to
    // land on, cargo or no cargo.
    path: '',
    pathMatch: 'full',
    redirectTo: 'profile',
  },
  {
    path: 'company',
    loadComponent: () => import('./pages/company-settings/company-settings').then((m) => m.CompanySettingsPage),
    canActivate: [planFeatureGuard('SETTINGS')],
    title: 'Configurações — Empresa',
  },
  {
    path: 'team',
    loadComponent: () => import('./pages/team-settings/team-settings').then((m) => m.TeamSettingsPage),
    canActivate: [planFeatureGuard('SETTINGS')],
    title: 'Configurações — Equipe',
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
