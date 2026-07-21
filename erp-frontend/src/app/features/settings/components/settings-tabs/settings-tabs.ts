import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PlanFeaturesService } from '../../../../core/services/plan-features.service';

@Component({
  selector: 'app-settings-tabs',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './settings-tabs.html',
  styleUrl: './settings-tabs.scss',
})
export class SettingsTabs {
  private readonly planFeatures = inject(PlanFeaturesService);

  /** Empresa and Equipe need SETTINGS — a cargo without it would only hit a redirect. */
  readonly showCompanyTabs = computed(() => this.planFeatures.has('SETTINGS'));
}
