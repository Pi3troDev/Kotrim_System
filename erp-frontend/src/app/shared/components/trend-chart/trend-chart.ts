import { Component, computed, input, signal } from '@angular/core';
import { MonthlyTrendPoint } from '../../interfaces/chart-data.interfaces';
import { formatCompactNumber, formatCurrencyBRL } from '../../utils/format.util';

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 260;
const PADDING = { top: 16, right: 12, bottom: 28, left: 12 };
const PLOT_WIDTH = VIEW_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = VIEW_HEIGHT - PADDING.top - PADDING.bottom;

interface PlottedPoint {
  x: number;
  revenueY: number;
  expensesY: number;
  point: MonthlyTrendPoint;
}

@Component({
  selector: 'app-trend-chart',
  imports: [],
  templateUrl: './trend-chart.html',
  styleUrl: './trend-chart.scss',
})
export class TrendChart {
  readonly data = input.required<MonthlyTrendPoint[]>();
  readonly title = input('Faturamento vs. Despesas');
  readonly subtitle = input('Últimos 6 meses');

  readonly hoverIndex = signal<number | null>(null);

  readonly viewBox = `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`;
  readonly plotTop = PADDING.top;
  readonly plotBottom = PADDING.top + PLOT_HEIGHT;

  readonly hasData = computed(() => this.data().some((p) => p.revenue > 0 || p.expenses > 0));

  readonly maxValue = computed(() => {
    const values = this.data().flatMap((p) => [p.revenue, p.expenses]);
    return niceMax(Math.max(...values, 0));
  });

  readonly yTicks = computed(() => {
    const max = this.maxValue();
    return [0, max / 2, max];
  });

  readonly points = computed<PlottedPoint[]>(() => {
    const data = this.data();
    const max = this.maxValue() || 1;
    const step = data.length > 1 ? PLOT_WIDTH / (data.length - 1) : 0;

    return data.map((point, index) => ({
      x: PADDING.left + step * index,
      revenueY: this.plotBottom - (point.revenue / max) * PLOT_HEIGHT,
      expensesY: this.plotBottom - (point.expenses / max) * PLOT_HEIGHT,
      point,
    }));
  });

  readonly revenuePath = computed(() => buildLinePath(this.points().map((p) => [p.x, p.revenueY])));
  readonly revenueAreaPath = computed(() =>
    buildAreaPath(
      this.points().map((p) => [p.x, p.revenueY]),
      this.plotBottom,
    ),
  );
  readonly expensesPath = computed(() => buildLinePath(this.points().map((p) => [p.x, p.expensesY])));

  readonly hovered = computed(() => {
    const index = this.hoverIndex();
    return index === null ? null : this.points()[index];
  });

  readonly tooltipStyle = computed(() => {
    const hovered = this.hovered();
    if (!hovered) return {};
    const leftPercent = (hovered.x / VIEW_WIDTH) * 100;
    const align = leftPercent > 65 ? 'right' : leftPercent < 20 ? 'left' : 'center';
    return { left: `${leftPercent}%`, '--tooltip-align': align };
  });

  formatCurrency(value: number): string {
    return formatCurrencyBRL(value);
  }

  formatCompact(value: number): string {
    return formatCompactNumber(value);
  }

  onPointerMove(event: PointerEvent): void {
    const points = this.points();
    if (points.length === 0) return;

    const rect = (event.currentTarget as Element).getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH;

    let closestIndex = 0;
    let closestDistance = Infinity;
    points.forEach((point, index) => {
      const distance = Math.abs(point.x - relativeX);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    this.hoverIndex.set(closestIndex);
  }

  onPointerLeave(): void {
    this.hoverIndex.set(null);
  }
}

function buildLinePath(coords: [number, number][]): string {
  return coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
}

function buildAreaPath(coords: [number, number][], baseline: number): string {
  if (coords.length === 0) return '';
  const line = buildLinePath(coords);
  const [firstX] = coords[0];
  const [lastX] = coords[coords.length - 1];
  return `${line} L ${lastX.toFixed(2)} ${baseline} L ${firstX.toFixed(2)} ${baseline} Z`;
}

function niceMax(value: number): number {
  if (value <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  let niceNormalized: number;
  if (normalized <= 1) niceNormalized = 1;
  else if (normalized <= 2) niceNormalized = 2;
  else if (normalized <= 5) niceNormalized = 5;
  else niceNormalized = 10;
  return niceNormalized * magnitude;
}
