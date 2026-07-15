import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-placeholder',
  imports: [MatIconModule],
  templateUrl: './page-placeholder.html',
  styleUrl: './page-placeholder.scss',
})
export class PagePlaceholder {
  readonly title = input('Módulo');
  readonly icon = input('construction');
}
