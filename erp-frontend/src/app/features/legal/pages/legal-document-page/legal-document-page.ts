import { Component, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { LegalService } from '../../../../core/services/legal.service';
import { LegalDocument, LegalDocumentType } from '../../../../core/interfaces/legal.interfaces';

/**
 * Public page for /termos and /privacidade — same component for both,
 * distinguished by route `data.type`. Renders `content` via `[innerHTML]`
 * because it comes straight from `LegalDocumentService` (authored by Kotrim,
 * same trust level as the app's own templates), same reasoning as
 * `LegalAcceptanceDialog`.
 */
@Component({
  selector: 'app-legal-document-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './legal-document-page.html',
  styleUrl: './legal-document-page.scss',
})
export class LegalDocumentPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly legalService = inject(LegalService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly document = signal<LegalDocument | null>(null);

  ngOnInit(): void {
    const type = this.route.snapshot.data['type'] as LegalDocumentType;

    this.legalService.getDocuments().subscribe({
      next: ({ terms, privacy }) => {
        this.document.set(type === 'TERMS' ? terms : privacy);
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
}
