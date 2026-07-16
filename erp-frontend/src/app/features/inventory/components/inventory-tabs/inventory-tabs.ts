import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-inventory-tabs',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './inventory-tabs.html',
  styleUrl: './inventory-tabs.scss',
})
export class InventoryTabs {}
