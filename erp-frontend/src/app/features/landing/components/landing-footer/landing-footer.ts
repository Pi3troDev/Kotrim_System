import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-footer',
  imports: [RouterLink],
  templateUrl: './landing-footer.html',
  styleUrl: './landing-footer.scss',
})
export class LandingFooter {
  readonly year = new Date().getFullYear();
}
