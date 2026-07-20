import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { SubscriptionService } from '../../features/subscription/services/subscription.service';
import { PlanFeature, Subscription } from '../../features/subscription/interfaces/subscription.interfaces';

/**
 * Holds the features the current company's plan unlocks.
 *
 * The list comes from the backend (`GET /subscriptions/me`) rather than a copy
 * of the matrix kept here — one matrix, one place. Everything this service does
 * is presentation: hiding a menu item the plan lacks. The real enforcement is
 * `PlanFeatureGuard` on the backend, which answers 403 no matter what the
 * browser believes.
 */
@Injectable({ providedIn: 'root' })
export class PlanFeaturesService {
  private readonly subscriptionService = inject(SubscriptionService);

  private readonly features = signal<PlanFeature[] | null>(null);
  private readonly subscription = signal<Subscription | null>(null);

  /** Null until loaded — callers should treat that as "not known yet", not "none". */
  readonly currentFeatures = this.features.asReadonly();
  readonly currentSubscription = this.subscription.asReadonly();
  readonly isLoaded = computed(() => this.features() !== null);

  load(): Observable<Subscription> {
    return this.subscriptionService.getMine().pipe(
      tap((subscription) => {
        this.subscription.set(subscription);
        this.features.set(subscription.features);
      }),
    );
  }

  /**
   * Unknown features resolve to false. A brief "menu item missing" while the
   * plan loads is recoverable; flashing Financeiro at a customer who did not buy
   * it is not.
   */
  has(feature: PlanFeature): boolean {
    return this.features()?.includes(feature) ?? false;
  }

  clear(): void {
    this.features.set(null);
    this.subscription.set(null);
  }
}
