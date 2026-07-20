import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ThemeService } from '../../../../core/services/theme.service';
import { SettingsTabs } from '../../components/settings-tabs/settings-tabs';

@Component({
  selector: 'app-preferences-settings-page',
  imports: [MatIconModule, MatSlideToggleModule, SettingsTabs],
  templateUrl: './preferences-settings.html',
  styleUrl: './preferences-settings.scss',
})
export class PreferencesSettingsPage {
  protected readonly themeService = inject(ThemeService);

  toggleTheme(): void {
    this.themeService.toggle();
  }
}
