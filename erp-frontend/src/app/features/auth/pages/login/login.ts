import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthAside } from '../../components/auth-aside/auth-aside';
import { PlanFeaturesService } from '../../../../core/services/plan-features.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AuthAside,
  ],
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly planFeatures = inject(PlanFeaturesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly isSubmitting = signal(false);
  readonly hidePassword = signal(true);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';

        // The plan's features must be known before navigating: planFeatureGuard
        // treats "not loaded" as "no access", so going straight to /dashboard
        // would bounce the user to /subscription on their own login.
        this.planFeatures.load().subscribe({
          next: () => void this.router.navigateByUrl(returnUrl),
          error: () => void this.router.navigateByUrl(returnUrl),
        });
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        const message = error.status === 401 ? 'E-mail ou senha inválidos.' : 'Não foi possível entrar. Tente novamente.';
        this.snackBar.open(message, 'Fechar', { duration: 5000 });
      },
    });
  }
}
