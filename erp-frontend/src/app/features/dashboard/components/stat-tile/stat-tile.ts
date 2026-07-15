import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-tile',
  imports: [MatIconModule],
  templateUrl: './stat-tile.html',
  styleUrl: './stat-tile.scss',
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly icon = input<string>('trending_up');
  /** Percentage change vs the previous period. Omit to render a plain tile with no delta chip. */
  readonly deltaPercent = input<number | undefined>(undefined);
  /** Whether an increase should read as good news (false for cost-like metrics). */
  readonly positiveIsGood = input(true);

  readonly deltaDirection = computed<'up' | 'down' | 'flat'>(() => {
    const delta = this.deltaPercent();
    if (delta === undefined || delta === 0) return 'flat';
    return delta > 0 ? 'up' : 'down';
  });

  readonly deltaTone = computed<'good' | 'bad' | 'neutral'>(() => {
    const direction = this.deltaDirection();
    if (direction === 'flat') return 'neutral';
    const isIncrease = direction === 'up';
    const isGood = this.positiveIsGood() ? isIncrease : !isIncrease;
    return isGood ? 'good' : 'bad';
  });
}
