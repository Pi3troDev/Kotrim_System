import { Component, ElementRef, OnInit, PLATFORM_ID, inject, viewChildren } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { LandingNav } from '../../components/landing-nav/landing-nav';
import { LandingPricing } from '../../components/landing-pricing/landing-pricing';
import { LandingFooter } from '../../components/landing-footer/landing-footer';
import { FEATURE_MODULES, FAQ_ITEMS, BENEFITS, STEPS, COMPARISON_ROWS } from '../../landing.content';

const SITE_URL = 'https://kotrim.com.br';
const PAGE_TITLE = 'Kotrim — o sistema que organiza sua oficina mecânica';
const PAGE_DESCRIPTION =
  'Ordens de serviço, clientes, veículos, estoque, financeiro e agenda em um só lugar. ' +
  'Feito para oficinas brasileiras. Teste 7 dias grátis, sem cartão.';

@Component({
  selector: 'app-landing-home',
  imports: [RouterLink, LandingNav, LandingPricing, LandingFooter],
  templateUrl: './landing-home.html',
  styleUrl: './landing-home.scss',
})
export class LandingHome implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly modules = FEATURE_MODULES;
  readonly faq = FAQ_ITEMS;
  readonly benefits = BENEFITS;
  readonly steps = STEPS;
  readonly comparison = COMPARISON_ROWS;

  /** Elements revealed on scroll. */
  private readonly revealTargets = viewChildren<ElementRef<HTMLElement>>('reveal');

  ngOnInit(): void {
    this.applyMeta();

    // Runs during prerendering too, so the crawler gets the tags in the HTML
    // rather than only after hydration.
    if (isPlatformBrowser(this.platformId)) {
      // Deferred to let the prerendered markup paint first.
      queueMicrotask(() => this.observeReveals());
    }
  }

  private applyMeta(): void {
    this.title.setTitle(PAGE_TITLE);

    this.meta.updateTag({ name: 'description', content: PAGE_DESCRIPTION });
    this.meta.updateTag({
      name: 'keywords',
      content:
        'sistema para oficina mecânica, software oficina, ordem de serviço, ERP automotivo, gestão de oficina',
    });

    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Kotrim' });
    this.meta.updateTag({ property: 'og:title', content: PAGE_TITLE });
    this.meta.updateTag({ property: 'og:description', content: PAGE_DESCRIPTION });
    this.meta.updateTag({ property: 'og:url', content: SITE_URL });
    this.meta.updateTag({ property: 'og:locale', content: 'pt_BR' });
    this.meta.updateTag({ property: 'og:image', content: `${SITE_URL}/brand/kotrim-logo-480.png` });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: PAGE_TITLE });
    this.meta.updateTag({ name: 'twitter:description', content: PAGE_DESCRIPTION });

    this.setCanonical(SITE_URL);
    this.setStructuredData();
  }

  private setCanonical(url: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  /**
   * SoftwareApplication + FAQPage JSON-LD. The FAQ block is generated from the
   * same array the page renders, so the structured data cannot drift from what
   * a visitor actually reads — which is exactly what Google penalises.
   */
  private setStructuredData(): void {
    const head = this.document.head;
    const existing = head.querySelector('#kotrim-jsonld');
    existing?.remove();

    const data = [
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Kotrim',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: PAGE_DESCRIPTION,
        url: SITE_URL,
        inLanguage: 'pt-BR',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'BRL',
          lowPrice: '99.00',
          highPrice: '349.00',
          offerCount: 3,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: this.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ];

    const script = this.document.createElement('script');
    script.id = 'kotrim-jsonld';
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(data);
    head.appendChild(script);
  }

  /**
   * Reveal-on-scroll via IntersectionObserver rather than a scroll handler:
   * it does not run on the main thread for every pixel, and elements already in
   * view when the page loads are revealed immediately instead of waiting for a
   * scroll that may never come.
   */
  private observeReveals(): void {
    const targets = this.revealTargets();
    if (targets.length === 0) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      for (const t of targets) t.nativeElement.classList.add('is-revealed');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    for (const t of targets) observer.observe(t.nativeElement);
  }
}
