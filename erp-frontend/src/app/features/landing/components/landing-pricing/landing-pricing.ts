import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { SubscriptionService } from '../../../subscription/services/subscription.service';
import { Plan } from '../../../subscription/interfaces/subscription.interfaces';

/**
 * Prices come from `GET /plans` — the same public endpoint the app's own
 * subscription screen reads. Hardcoding them here would mean the marketing page
 * and the checkout could quote different numbers, and the page nobody thinks to
 * update is always the marketing one.
 */
@Component({
  selector: 'app-landing-pricing',
  imports: [CurrencyPipe],
  templateUrl: './landing-pricing.html',
  styleUrl: './landing-pricing.scss',
})
export class LandingPricing implements OnInit {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly router = inject(Router);

  readonly plans = signal<Plan[]>([]);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  /** The middle tier carries the badge; it is the one most workshops land on. */
  readonly featuredSlug = 'profissional';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.subscriptionService.listPlans().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
      },
    });
  }

  /** Start the free trial. Registration creates the company already on TRIAL. */
  startTrial(): void {
    void this.router.navigate(['/auth/register']);
  }

  /**
   * "Subscribe now" still routes through registration: there is no account to
   * bill yet. The chosen plan rides along so the subscription page can open on
   * it once the company exists.
   */
  subscribeNow(plan: Plan): void {
    void this.router.navigate(['/auth/register'], { queryParams: { plano: plan.slug } });
  }
}
