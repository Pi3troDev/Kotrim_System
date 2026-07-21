import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { NAV_ITEMS } from '../../core/config/nav-items';
import { AuthService } from '../../core/services/auth.service';
import { PlanFeaturesService } from '../../core/services/plan-features.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatRippleModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly authService = inject(AuthService);
  private readonly planFeatures = inject(PlanFeaturesService);

  /**
   * Hides what the plan or the user's own cargo does not include, and
   * staff-only entries from everyone else. Cosmetic: typing the URL is
   * stopped by the route guard, and the API answers 403 regardless.
   */
  readonly navItems = computed(() => {
    const isSuperAdmin = this.authService.currentUser()?.isSuperAdmin ?? false;

    return NAV_ITEMS.filter((item) => {
      if (item.superAdminOnly && !isSuperAdmin) return false;
      if (!item.feature || isSuperAdmin) return true;
      return this.planFeatures.has(item.feature);
    });
  });
}
