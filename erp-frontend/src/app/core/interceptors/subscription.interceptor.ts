import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Catches the two billing rejections the backend can raise on any request:
 *
 *   402 SUBSCRIPTION_REQUIRED  — trial lapsed / not paid → the subscription page
 *   403 PLAN_UPGRADE_REQUIRED  — plan does not include this module → upgrade
 *
 * They are separate codes because they need separate screens; collapsing them
 * would tell a paying customer their subscription expired when they simply need
 * a bigger plan.
 *
 * Only PLAN_UPGRADE_REQUIRED is intercepted among 403s — a plain 403 (role or
 * super-admin) is left to the caller, since redirecting it would hide genuine
 * permission errors.
 */
export const subscriptionInterceptor: HttpInterceptorFn = (req, next) => {
  // Resolved here, not inside catchError: the error callback runs outside the
  // injection context.
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const code = (error.error as { error?: string; feature?: string } | null)?.error;

        if (error.status === 402) {
          void router.navigate(['/subscription']);
        } else if (error.status === 403 && code === 'PLAN_UPGRADE_REQUIRED') {
          const feature = (error.error as { feature?: string } | null)?.feature;
          void router.navigate(['/subscription'], { queryParams: feature ? { upgrade: feature } : {} });
        }
      }
      return throwError(() => error);
    }),
  );
};
