import { Routes } from '@angular/router';

export const AGENDA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/agenda-board/agenda-board').then((m) => m.AgendaBoard),
    title: 'Agenda',
  },
];
