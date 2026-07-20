import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PlanFeature } from '../../features/subscription/interfaces/subscription.interfaces';
import { AuthService } from '../services/auth.service';
import { PlanFeaturesService } from '../services/plan-features.service';

/**
 * Blocks a route the plan does not include, e.g. a URL typed by hand or an old
 * bookmark kept after a downgrade.
 *
 * Convenience only — the backend's PlanFeatureGuard is what actually protects
 * the data. This exists so the user gets the upgrade page instead of a screen
 * full of failed requests.
 */
export function planFeatureGuard(feature: PlanFeature): CanActivateFn {
  return () => {
    const planFeatures = inject(PlanFeaturesService);
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.currentUser()?.isSuperAdmin) {
      return true;
    }

    if (planFeatures.has(feature)) {
      return true;
    }

    return router.createUrlTree(['/subscription'], { queryParams: { upgrade: feature } });
  };
}
