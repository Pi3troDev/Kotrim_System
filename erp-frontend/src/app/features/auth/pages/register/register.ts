import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { PlanFeaturesService } from '../../../../core/services/plan-features.service';
import { CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthAside } from '../../components/auth-aside/auth-aside';
import { DigitMaskDirective } from '../../../../shared/directives/digit-mask.directive';
import { SubscriptionService } from '../../../subscription/services/subscription.service';
import { Plan, RegistrationIntent } from '../../../subscription/interfaces/subscription.interfaces';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule,
    CurrencyPipe,
    DigitMaskDirective,
    AuthAside,
  ],
  templateUrl: './register.html',
})
export class Register implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly planFeatures = inject(PlanFeaturesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly snackBar = inject(MatSnackBar);

  readonly isSubmitting = signal(false);
  readonly hidePassword = signal(true);

  /**
   * Which funnel the visitor came through. `?plano=<slug>` on the URL means
   * they clicked "Assinar agora" on a specific plan; no plano means the free
   * trial. This is what decides whether the new company gets 7 free days.
   */
  readonly intent = signal<RegistrationIntent>('TRIAL');
  readonly chosenPlan = signal<Plan | null>(null);
  readonly isSubscribeFlow = computed(() => this.intent() === 'SUBSCRIBE');

  readonly form = this.fb.nonNullable.group({
    companyName: ['', [Validators.required, Validators.minLength(2)]],
    companyDocument: ['', [Validators.required, Validators.minLength(11)]],
    adminName: ['', [Validators.required, Validators.minLength(2)]],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminPassword: ['', [Validators.required, Validators.minLength(10)]],
    acceptedTerms: [false, [Validators.requiredTrue]],
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.queryParamMap.get('plano');
    if (!slug) return;

    this.intent.set('SUBSCRIBE');

    // Fetched so the page can name the plan and its price rather than showing a
    // bare slug. A failure is non-fatal: the flow still works, the header just
    // stays generic.
    this.subscriptionService.listPlans().subscribe({
      next: (plans) => this.chosenPlan.set(plans.find((p) => p.slug === slug) ?? null),
      error: () => this.chosenPlan.set(null),
    });
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      ...this.form.getRawValue(),
      intent: this.intent(),
      planSlug: this.chosenPlan()?.slug ?? this.route.snapshot.queryParamMap.get('plano') ?? undefined,
    };

    this.authService.registerCompany(payload).subscribe({
      next: () => {
        // "Assinar agora" creates a PENDING subscription with no trial, so the
        // ERP is closed to it: send them to pay, not to a dashboard that would
        // 402 on its first request.
        const destination = this.isSubscribeFlow() ? '/subscription' : '/dashboard';

        // planFeatureGuard reads "not loaded" as "no access", so the plan must
        // be known before navigating into the shell.
        this.planFeatures.load().subscribe({
          next: () => void this.router.navigateByUrl(destination),
          error: () => void this.router.navigateByUrl(destination),
        });
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        const message = this.resolveErrorMessage(error);
        this.snackBar.open(message, 'Fechar', { duration: 5000 });
      },
    });
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status !== 409) {
      return 'Não foi possível concluir o cadastro.';
    }

    const backendMessage = (error.error as { message?: string } | null)?.message;
    if (backendMessage?.includes('document')) {
      return 'Já existe uma oficina cadastrada com esse CNPJ/CPF.';
    }
    return 'Este e-mail já está em uso.';
  }
}
