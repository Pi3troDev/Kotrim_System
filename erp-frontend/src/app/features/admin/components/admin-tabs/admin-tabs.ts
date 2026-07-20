import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Mirrors the tabs pattern used by settings/finance/reports. */
@Component({
  selector: 'app-admin-tabs',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-tabs.html',
  styleUrl: './admin-tabs.scss',
})
export class AdminTabs {}
