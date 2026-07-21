import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { planFeatureGuard } from './core/guards/plan-feature.guard';
import { landingGuard } from './core/guards/landing.guard';
import { LEGAL_ROUTES } from './features/legal/legal.routes';

export const routes: Routes = [
  {
    // The public marketing site. This is the one route that gets prerendered
    // (see app.routes.server.ts) — a crawler must find real HTML here.
    //
    // landingGuard sends an already-authenticated visitor straight to the
    // dashboard: someone with a session is a customer, not a prospect, and
    // showing them the sales pitch on every visit to "/" would be daft.
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./features/landing/landing.routes').then((m) => m.LANDING_ROUTES),
    canActivate: [landingGuard],
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  // Public: /termos and /privacidade, linked from the landing footer and the
  // registration checkbox, logged in or not.
  ...LEGAL_ROUTES,
  {
    // Deliberately outside the Shell: a locked-out company gets 402 on every
    // ERP endpoint, so rendering the shell here would fill the page with failed
    // requests behind the very screen telling them how to fix it.
    path: 'subscription',
    loadChildren: () => import('./features/subscription/subscription.routes').then((m) => m.SUBSCRIPTION_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
        canActivate: [planFeatureGuard('DASHBOARD')],
      },
      {
        path: 'clients',
        loadChildren: () => import('./features/clients/clients.routes').then((m) => m.CLIENTS_ROUTES),
        canActivate: [planFeatureGuard('CLIENTS')],
      },
      {
        path: 'vehicles',
        loadChildren: () => import('./features/vehicles/vehicles.routes').then((m) => m.VEHICLES_ROUTES),
        canActivate: [planFeatureGuard('VEHICLES')],
      },
      {
        path: 'work-orders',
        loadChildren: () =>
          import('./features/work-orders/work-orders.routes').then((m) => m.WORK_ORDERS_ROUTES),
        canActivate: [planFeatureGuard('WORK_ORDERS')],
      },
      {
        path: 'inventory',
        loadChildren: () => import('./features/inventory/inventory.routes').then((m) => m.INVENTORY_ROUTES),
        canActivate: [planFeatureGuard('INVENTORY')],
      },
      {
        path: 'finance',
        loadChildren: () => import('./features/finance/finance.routes').then((m) => m.FINANCE_ROUTES),
        canActivate: [planFeatureGuard('FINANCE')],
      },
      {
        path: 'employees',
        loadChildren: () => import('./features/employees/employees.routes').then((m) => m.EMPLOYEES_ROUTES),
        canActivate: [planFeatureGuard('EMPLOYEES')],
      },
      {
        path: 'agenda',
        loadChildren: () => import('./features/agenda/agenda.routes').then((m) => m.AGENDA_ROUTES),
        canActivate: [planFeatureGuard('AGENDA')],
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
        canActivate: [planFeatureGuard('REPORTS')],
      },
      {
        // No feature gate here on purpose: Preferências and Meu Perfil (inside
        // SETTINGS_ROUTES) are personal account settings, open to every login
        // regardless of cargo. Empresa and Equipe are the parts that actually
        // need SETTINGS, and are gated per-route instead.
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
        canActivate: [superAdminGuard],
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found').then((m) => m.NotFound),
    title: 'Página não encontrada',
  },
];
