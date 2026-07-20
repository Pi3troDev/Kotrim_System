import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { PlanFeaturesService } from './plan-features.service';
import { AdminService } from '../../features/admin/services/admin.service';
import { ImpersonationSession } from '../../features/admin/interfaces/admin.interfaces';

/**
 * Holds the "viewing as customer" state.
 *
 * The trick that makes leaving trivial: the staff member's own refresh cookie is
 * never touched. Starting an impersonation only swaps the in-memory access
 * token; ending it calls `refreshSession()`, and the cookie that was sitting
 * there the whole time hands their real session straight back.
 */
@Injectable({ providedIn: 'root' })
export class ImpersonationService {
  private readonly authService = inject(AuthService);
  private readonly planFeatures = inject(PlanFeaturesService);
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  private readonly session = signal<ImpersonationSession | null>(null);

  readonly current = this.session.asReadonly();
  readonly isImpersonating = computed(() => this.session() !== null);
  readonly companyName = computed(() => this.session()?.company.name ?? '');

  start(companyId: string): Observable<ImpersonationSession> {
    return this.adminService.impersonate(companyId).pipe(
      tap((session) => {
        this.session.set(session);

        // Swap the in-memory token for the impersonated one. The refresh cookie
        // is left alone — it is what we climb back out on.
        this.authService.setSession({
          accessToken: session.accessToken,
          user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            companyId: session.company.id,
            role: session.user.role,
            isSuperAdmin: false,
            impersonatedBy: 'staff',
          },
        });
      }),
    );
  }

  /**
   * Ends the session and returns the staff member to their own account.
   *
   * The audit call goes first and its failure is ignored: if the record cannot
   * be written, the right outcome is still to get out — being stuck inside a
   * customer's account would be worse than a missing closing bracket.
   */
  stop(): void {
    this.adminService.endImpersonation().subscribe({
      next: () => this.restoreSuperAdmin(),
      error: () => this.restoreSuperAdmin(),
    });
  }

  private restoreSuperAdmin(): void {
    this.session.set(null);

    this.authService.refreshSession().subscribe({
      next: () => {
        this.planFeatures.load().subscribe({
          next: () => void this.router.navigateByUrl('/admin'),
          error: () => void this.router.navigateByUrl('/admin'),
        });
      },
      // The refresh cookie expired while support was inside. Nothing to restore.
      error: () => {
        this.authService.clearSession();
        this.planFeatures.clear();
        void this.router.navigateByUrl('/auth/login');
      },
    });
  }
}
