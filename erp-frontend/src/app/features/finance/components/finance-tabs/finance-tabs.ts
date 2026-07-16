import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-finance-tabs',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './finance-tabs.html',
  styleUrl: './finance-tabs.scss',
})
export class FinanceTabs {}
