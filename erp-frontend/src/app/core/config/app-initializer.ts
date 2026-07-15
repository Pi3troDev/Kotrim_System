import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Runs once at bootstrap (passed by reference to `provideAppInitializer`, which
 * calls it within an injection context — it must not be invoked eagerly here).
 * Silently exchanges the httpOnly refresh cookie (if any) for a fresh access
 * token so a page reload doesn't force a re-login. A failure here just means
 * the user is logged out — never blocks startup.
 */
export async function initializeSession(): Promise<void> {
  const authService = inject(AuthService);

  try {
    await firstValueFrom(authService.refreshSession());
  } catch {
    authService.clearSession();
  }
}
