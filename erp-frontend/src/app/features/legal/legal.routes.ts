import { Routes } from '@angular/router';

export const LEGAL_ROUTES: Routes = [
  {
    path: 'termos',
    loadComponent: () => import('./pages/legal-document-page/legal-document-page').then((m) => m.LegalDocumentPage),
    data: { type: 'TERMS' },
    title: 'Termos de Uso',
  },
  {
    path: 'privacidade',
    loadComponent: () => import('./pages/legal-document-page/legal-document-page').then((m) => m.LegalDocumentPage),
    data: { type: 'PRIVACY' },
    title: 'Política de Privacidade',
  },
];
