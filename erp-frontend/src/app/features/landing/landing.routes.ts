import { Routes } from '@angular/router';

export const LANDING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing-home/landing-home').then((m) => m.LandingHome),
  },
];
