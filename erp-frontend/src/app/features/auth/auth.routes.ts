import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/guest.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    canActivate: [guestGuard],
    title: 'Entrar',
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
    canActivate: [guestGuard],
    title: 'Criar conta',
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password').then((m) => m.ForgotPassword),
    canActivate: [guestGuard],
    title: 'Esqueci minha senha',
  },
  {
    // No guestGuard: a reset link must work even if a stale session is still
    // sitting in the tab — that is often exactly why someone is resetting.
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password').then((m) => m.ResetPassword),
    title: 'Redefinir senha',
  },
  {
    // No guestGuard either: the setup link is redeemed while logged out, and
    // bouncing an already-authenticated visitor away would strand anyone who
    // still needs to set a password.
    path: 'create-password',
    loadComponent: () => import('./pages/create-password/create-password').then((m) => m.CreatePassword),
    title: 'Criar senha',
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
];
