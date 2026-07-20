import { Component, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LegalService } from '../../../core/services/legal.service';
import { AuthService } from '../../../core/services/auth.service';
import { LegalDocument } from '../../../core/interfaces/legal.interfaces';

/**
 * The blocking gate a session hits the moment `LegalAcceptanceGuard` answers
 * 403 LEGAL_ACCEPTANCE_REQUIRED — see `legal.interceptor.ts`, which is the
 * only place that opens this dialog.
 *
 * Renders document content via `[innerHTML]` rather than the sandboxed iframe
 * `MailPreviewDialog` uses: that one interpolates a workshop's own name into
 * the markup, this one never interpolates anything — the HTML comes straight
 * from `LegalDocumentService`, authored by Kotrim, same trust level as the
 * app's own templates.
 */
@Component({
  selector: 'app-legal-acceptance-dialog',
  imports: [MatDialogModule, MatButtonModule, MatCheckboxModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './legal-acceptance-dialog.html',
  styleUrl: './legal-acceptance-dialog.scss',
})
export class LegalAcceptanceDialog implements OnInit {
  private readonly legalService = inject(LegalService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly dialogRef = inject(MatDialogRef<LegalAcceptanceDialog, boolean>);

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly isSubmitting = signal(false);
  readonly confirmed = signal(false);
  readonly pendingDocuments = signal<LegalDocument[]>([]);

  ngOnInit(): void {
    forkJoin({
      documents: this.legalService.getDocuments(),
      pending: this.legalService.getPending(),
    }).subscribe({
      next: ({ documents, pending }) => {
        const pendingTypes = new Set(pending.pending.map((doc) => doc.type));
        const all = [documents.terms, documents.privacy].filter((doc) => pendingTypes.has(doc.type));
        this.pendingDocuments.set(all);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
      },
    });
  }

  trustedHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  accept(): void {
    if (!this.confirmed() || this.isSubmitting()) return;
    this.isSubmitting.set(true);

    const documentIds = this.pendingDocuments().map((doc) => doc.id);
    this.legalService.accept(documentIds).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.isSubmitting.set(false),
    });
  }

  /** The escape hatch for someone who does not want to accept right now: leave, don't get trapped. */
  logout(): void {
    this.authService.logout().subscribe({
      complete: () => {
        this.dialogRef.close(false);
        void this.router.navigate(['/auth/login']);
      },
    });
  }
}
