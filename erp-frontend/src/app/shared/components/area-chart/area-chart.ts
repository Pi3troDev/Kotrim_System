import { Component, computed, input, signal } from '@angular/core';

export interface AreaPoint {
  label: string;
  value: number;
}

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 220;
const PADDING = { top: 16, right: 12, bottom: 26, left: 12 };
const PLOT_WIDTH = VIEW_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = VIEW_HEIGHT - PADDING.top - PADDING.bottom;

interface Plotted {
  x: number;
  y: number;
  point: AreaPoint;
}

/**
 * A single-series area chart.
 *
 * Hand-rolled SVG, like the TrendChart it sits beside — a charting library would
 * add ~100 KB to the bundle to draw one line, and this scales to any DPI without
 * one. Sibling of TrendChart rather than a generalisation of it: that one plots
 * two series against each other, this plots one over time, and merging them
 * would produce a component with a flag for everything.
 */
@Component({
  selector: 'app-area-chart',
  imports: [],
  templateUrl: './area-chart.html',
  styleUrl: './area-chart.scss',
})
export class AreaChart {
  readonly data = input.required<AreaPoint[]>();
  readonly title = input('');
  readonly subtitle = input('');
  /** Formats the value in the tooltip and the peak label. */
  readonly format = input<(value: number) => string>((value) => String(value));

  readonly hoverIndex = signal<number | null>(null);

  readonly viewBox = `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`;

  private readonly maxValue = computed(() => {
    const max = Math.max(...this.data().map((d) => d.value), 0);
    // A flat-zero series would divide by zero and collapse the line onto the
    // axis; 1 keeps it on the floor where it belongs.
    return max === 0 ? 1 : max;
  });

  readonly points = computed<Plotted[]>(() => {
    const data = this.data();
    if (data.length === 0) return [];

    const max = this.maxValue();
    const step = data.length === 1 ? 0 : PLOT_WIDTH / (data.length - 1);

    return data.map((point, i) => ({
      x: PADDING.left + step * i,
      y: PADDING.top + PLOT_HEIGHT - (point.value / max) * PLOT_HEIGHT,
      point,
    }));
  });

  readonly linePath = computed(() => {
    const points = this.points();
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  });

  readonly areaPath = computed(() => {
    const points = this.points();
    if (points.length === 0) return '';
    const floor = PADDING.top + PLOT_HEIGHT;
    const first = points[0];
    const last = points[points.length - 1];
    return `${this.linePath()} L${last.x.toFixed(1)},${floor} L${first.x.toFixed(1)},${floor} Z`;
  });

  /** Horizontal guides at 0/50/100% — enough to read a level, few enough to stay quiet. */
  readonly gridLines = computed(() =>
    [0, 0.5, 1].map((ratio) => PADDING.top + PLOT_HEIGHT - ratio * PLOT_HEIGHT),
  );

  readonly hovered = computed(() => {
    const index = this.hoverIndex();
    return index === null ? null : (this.points()[index] ?? null);
  });

  /** Every other label on a 12-month series; all of them when there is room. */
  showLabel(index: number): boolean {
    return this.data().length <= 7 || index % 2 === 0;
  }

  formatValue(value: number): string {
    return this.format()(value);
  }

  onEnter(index: number): void {
    this.hoverIndex.set(index);
  }

  onLeave(): void {
    this.hoverIndex.set(null);
  }

  /** Width of each invisible hover column. */
  readonly hitWidth = computed(() => {
    const count = this.data().length;
    return count === 0 ? 0 : PLOT_WIDTH / Math.max(1, count - 1);
  });

  readonly plotBottom = PADDING.top + PLOT_HEIGHT;
  readonly plotTop = PADDING.top;
}
