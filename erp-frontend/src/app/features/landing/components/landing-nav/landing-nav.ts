import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-nav',
  imports: [RouterLink],
  templateUrl: './landing-nav.html',
  styleUrl: './landing-nav.scss',
})
export class LandingNav {
  /** Drives the nav's shift from transparent-over-hero to an opaque bar. */
  readonly isScrolled = signal(false);
  readonly isMenuOpen = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 12);
  }

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
