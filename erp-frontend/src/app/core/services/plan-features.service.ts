import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { SubscriptionService } from '../../features/subscription/services/subscription.service';
import { PlanFeature, Subscription } from '../../features/subscription/interfaces/subscription.interfaces';
import { AuthService } from './auth.service';

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
  private readonly authService = inject(AuthService);

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
   * True only when both the plan and the user's own cargo include it — a
   * Mecânico on Oficina Plus still has no reason to see Financeiro.
   *
   * Unknown resolves to false either way. A brief "menu item missing" while
   * the session loads is recoverable; flashing Financeiro at someone who
   * cannot open it is not.
   */
  has(feature: PlanFeature): boolean {
    const planAllows = this.features()?.includes(feature) ?? false;
    const roleAllows = this.authService.currentUser()?.roleAllowedFeatures.includes(feature) ?? false;
    return planAllows && roleAllows;
  }

  clear(): void {
    this.features.set(null);
    this.subscription.set(null);
  }
}
