import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ImpersonationService } from '../../core/services/impersonation.service';

/**
 * The bar that says, unmistakably, that you are not looking at your own account.
 *
 * Deliberately loud and deliberately not dismissible: the failure mode this
 * prevents is a support person forgetting where they are and reading a
 * customer's numbers as if they were the platform's.
 */
@Component({
  selector: 'app-impersonation-banner',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './impersonation-banner.html',
  styleUrl: './impersonation-banner.scss',
})
export class ImpersonationBanner {
  private readonly impersonation = inject(ImpersonationService);

  readonly isImpersonating = this.impersonation.isImpersonating;
  readonly companyName = this.impersonation.companyName;
  readonly session = this.impersonation.current;

  exit(): void {
    this.impersonation.stop();
  }
}
