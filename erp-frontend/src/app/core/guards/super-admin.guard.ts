import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Hides the Kotrim admin panel from workshop users. Cosmetic only — the real
 * enforcement is `SuperAdminGuard` on the backend, which answers 403 regardless
 * of what the browser thinks.
 */
export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser()?.isSuperAdmin) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
