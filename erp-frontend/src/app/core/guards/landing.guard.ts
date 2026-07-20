import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Keeps signed-in users off the marketing page — they get the dashboard.
 *
 * Always allows during prerendering: the build step has no session, and the
 * landing page is exactly what must be rendered into the static HTML.
 */
export const landingGuard: CanActivateFn = () => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return true;
  }

  const authService = inject(AuthService);
  return authService.isAuthenticated() ? inject(Router).createUrlTree(['/dashboard']) : true;
};
