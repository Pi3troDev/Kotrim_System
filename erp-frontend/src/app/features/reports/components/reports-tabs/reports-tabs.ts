import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-reports-tabs',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './reports-tabs.html',
  styleUrl: './reports-tabs.scss',
})
export class ReportsTabs {}
