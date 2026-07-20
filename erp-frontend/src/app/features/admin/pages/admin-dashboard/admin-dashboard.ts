import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AreaChart, AreaPoint } from '../../../../shared/components/area-chart/area-chart';
import { AdminTabs } from '../../components/admin-tabs/admin-tabs';
import { AdminService } from '../../services/admin.service';
import { AdminMetrics } from '../../interfaces/admin.interfaces';
import { SubscriptionStatus } from '../../../subscription/interfaces/subscription.interfaces';
import { formatCurrencyBRL } from '../../../../shared/utils/format.util';
import { subscriptionStatusLabel } from '../../subscription-status';

/**
 * The business, on one screen.
 *
 * The rule this page is built around: a metric with no data behind it renders as
 * "—", never as 0. A 0% churn on a product with two customers is not a good
 * number, it is a meaningless one, and the difference matters most on exactly
 * the day someone quotes it.
 */
@Component({
  selector: 'app-admin-dashboard-page',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    AreaChart,
    AdminTabs,
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboardPage implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly metrics = signal<AdminMetrics | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  /** Money for the chart, which wants numbers, not cents. */
  readonly revenueSeries = computed<AreaPoint[]>(
    () => this.metrics()?.revenue.byMonth.map((p) => ({ label: p.label, value: p.cents / 100 })) ?? [],
  );

  readonly revenueFormat = (value: number): string => formatCurrencyBRL(value);

  /** True once any money has ever come in — before that the chart is a flat line pretending to be a trend. */
  readonly hasRevenue = computed(() => (this.metrics()?.revenue.totalCents ?? 0) > 0);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.adminService.getMetrics().subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
      },
    });
  }

  statusLabel(status: SubscriptionStatus | null): string {
    return subscriptionStatusLabel(status);
  }

  money(cents: number): string {
    return formatCurrencyBRL(cents / 100);
  }

  /** The whole point of the null contract: a dash, not a zero. */
  percent(value: number | null): string {
    return value === null ? '—' : `${value}%`;
  }

  /** Explains *why* a metric is a dash, so nobody thinks it is broken. */
  percentHint(value: number | null, reason: string): string {
    return value === null ? reason : '';
  }

  storage(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }

  growthTone(percent: number | null): 'up' | 'down' | 'flat' {
    if (percent === null || percent === 0) return 'flat';
    return percent > 0 ? 'up' : 'down';
  }
}
