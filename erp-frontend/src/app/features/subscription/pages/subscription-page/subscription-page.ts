import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { PlanFeaturesService } from '../../../../core/services/plan-features.service';
import { SubscriptionService } from '../../services/subscription.service';
import { CheckoutResult, Plan, Subscription } from '../../interfaces/subscription.interfaces';

@Component({
  selector: 'app-subscription-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './subscription-page.html',
  styleUrl: './subscription-page.scss',
})
export class SubscriptionPage implements OnInit {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly planFeatures = inject(PlanFeaturesService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly plans = signal<Plan[]>([]);
  readonly subscription = signal<Subscription | null>(null);
  readonly checkingOutPlanId = signal<string | null>(null);
  /** Set once a manual checkout succeeds; drives the payment-instructions panel. */
  readonly instructions = signal<Extract<CheckoutResult, { kind: 'manual_instructions' }> | null>(null);

  readonly userName = computed(() => this.authService.currentUser()?.name ?? '');

  readonly statusLabel = computed(() => {
    const current = this.subscription();
    if (!current) return '';

    switch (current.status) {
      case 'PENDING':
        return 'Aguardando pagamento';
      case 'TRIAL':
        return current.daysRemaining === 1
          ? 'Teste grátis — termina amanhã'
          : `Teste grátis — ${current.daysRemaining} dias restantes`;
      case 'ACTIVE':
        return 'Assinatura ativa';
      case 'EXPIRED':
        return 'Assinatura expirada';
      case 'CANCELLED':
        return 'Assinatura cancelada';
    }
  });

  /** Drives the status chip colour and, more importantly, whether we nag. */
  readonly isBlocked = computed(() => this.subscription()?.hasAccess === false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    forkJoin({
      plans: this.subscriptionService.listPlans(),
      // Through PlanFeaturesService rather than the raw endpoint, so landing
      // here after an upgrade refreshes the sidebar too.
      subscription: this.planFeatures.load(),
    }).subscribe({
      next: ({ plans, subscription }) => {
        this.plans.set(plans);
        this.subscription.set(subscription);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
      },
    });
  }

  isCurrentPlan(plan: Plan): boolean {
    const current = this.subscription();
    return current?.status === 'ACTIVE' && current.plan?.id === plan.id;
  }

  subscribe(plan: Plan): void {
    if (this.checkingOutPlanId()) return;

    this.checkingOutPlanId.set(plan.id);
    this.subscriptionService.checkout(plan.id).subscribe({
      next: (result) => {
        this.checkingOutPlanId.set(null);

        // The two arms of CheckoutResult. `redirect` is unreachable today
        // (manual billing only), but handling it here is what lets a real
        // gateway be switched on without touching this page.
        if (result.kind === 'redirect') {
          window.location.href = result.url;
          return;
        }

        this.instructions.set(result);
        this.planFeatures.load().subscribe((subscription) => this.subscription.set(subscription));
      },
      error: (error: HttpErrorResponse) => {
        this.checkingOutPlanId.set(null);
        const message =
          error.status === 400
            ? 'Sua assinatura já está ativa.'
            : 'Não foi possível iniciar a assinatura. Tente novamente.';
        this.snackBar.open(message, 'Fechar', { duration: 5000 });
      },
    });
  }

  dismissInstructions(): void {
    this.instructions.set(null);
  }

  async copyPixKey(key: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(key);
      this.snackBar.open('Chave Pix copiada.', 'Fechar', { duration: 3000 });
    } catch {
      // Clipboard access can be denied (insecure context, permissions). The key
      // is on screen either way, so this is a convenience, not a failure.
      this.snackBar.open('Não foi possível copiar. Selecione a chave manualmente.', 'Fechar', {
        duration: 4000,
      });
    }
  }

  logout(): void {
    this.planFeatures.clear();
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/auth/login']),
      error: () => void this.router.navigate(['/auth/login']),
    });
  }
}
