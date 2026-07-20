import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-settings-tabs',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './settings-tabs.html',
  styleUrl: './settings-tabs.scss',
})
export class SettingsTabs {}
