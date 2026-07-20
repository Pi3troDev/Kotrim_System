import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../../../environments/environment';
import { AuthAside } from '../../components/auth-aside/auth-aside';

@Component({
  selector: 'app-forgot-password',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    AuthAside,
  ],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  readonly isSubmitting = signal(false);
  readonly isSent = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.http.post(`${environment.apiUrl}/auth/password/forgot`, this.form.getRawValue()).subscribe({
      // Success and failure land on the same screen, deliberately.
      //
      // The backend already answers 202 whether or not the address exists — if
      // this page then showed an error for an unknown e-mail, it would hand back
      // the very answer the endpoint refuses to give, and turn the form into a
      // way to check who has a Kotrim account.
      next: () => {
        this.isSubmitting.set(false);
        this.isSent.set(true);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.isSent.set(true);
      },
    });
  }

  /** Shown on the confirmation screen so the user can spot a typo. */
  get submittedEmail(): string {
    return this.form.getRawValue().email;
  }
}
