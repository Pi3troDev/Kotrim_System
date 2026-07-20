import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { PlanFeaturesService } from '../services/plan-features.service';

/**
 * Runs once at bootstrap (passed by reference to `provideAppInitializer`, which
 * calls it within an injection context — it must not be invoked eagerly here).
 * Silently exchanges the httpOnly refresh cookie (if any) for a fresh access
 * token so a page reload doesn't force a re-login, then loads the plan's
 * features so the first paint of the sidebar is already correct.
 *
 * A failure here just means the user is logged out — never blocks startup.
 */
export async function initializeSession(): Promise<void> {
  const authService = inject(AuthService);
  const planFeatures = inject(PlanFeaturesService);

  // Skipped during prerendering: there is no refresh cookie in a build step, and
  // calling the API from Node at build time would either hang or bake a logged
  // out state into the HTML. The landing page is public and needs neither.
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return;
  }

  try {
    await firstValueFrom(authService.refreshSession());
  } catch {
    authService.clearSession();
    return;
  }

  try {
    await firstValueFrom(planFeatures.load());
  } catch {
    // Non-fatal, and deliberately not a logout: an expired company gets 402 on
    // most routes but /subscriptions/me still answers, so reaching here means
    // something else went wrong. Features stay unknown, the guard treats that
    // as "no", and the user lands on a sparse but working app rather than a
    // blocked bootstrap.
    planFeatures.clear();
  }
}
