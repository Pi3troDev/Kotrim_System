import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { AuthAside } from '../../components/auth-aside/auth-aside';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value as string;
  const confirm = group.get('confirmPassword')?.value as string;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
}

/**
 * Redeems a single-use RESET token from the e-mailed link.
 *
 * Near-identical to CreatePassword (the super-admin bootstrap), and kept
 * separate on purpose: they hit different endpoints with different token
 * purposes, and merging them would mean one component deciding which kind of
 * token it holds — the sort of branch that eventually lets a SETUP link be
 * redeemed as a RESET.
 */
@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.html',
})
export class ResetPassword implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly isValidating = signal(true);
  readonly isTokenValid = signal(false);
  readonly isSubmitting = signal(false);
  readonly hidePassword = signal(true);
  readonly accountEmail = signal('');

  private token = '';

  readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(10)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      this.isValidating.set(false);
      return;
    }

    // Checked up front so an expired link says so immediately, rather than
    // after the user has typed a password twice.
    this.http
      .post<{ email: string; name: string }>(`${environment.apiUrl}/auth/password/validate-reset-token`, {
        token: this.token,
      })
      .subscribe({
        next: (account) => {
          this.accountEmail.set(account.email);
          this.isTokenValid.set(true);
          this.isValidating.set(false);
        },
        error: () => {
          this.isTokenValid.set(false);
          this.isValidating.set(false);
        },
      });
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.http
      .post(`${environment.apiUrl}/auth/password/reset`, {
        token: this.token,
        password: this.form.getRawValue().password,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Senha alterada. Faça login com a nova senha.', 'Fechar', { duration: 6000 });
          void this.router.navigate(['/auth/login']);
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          const backendMessage = (error.error as { message?: string | string[] } | null)?.message;
          const message = Array.isArray(backendMessage) ? backendMessage.join(' ') : backendMessage;
          this.snackBar.open(message || 'Não foi possível alterar a senha.', 'Fechar', { duration: 6000 });
        },
      });
  }
}
