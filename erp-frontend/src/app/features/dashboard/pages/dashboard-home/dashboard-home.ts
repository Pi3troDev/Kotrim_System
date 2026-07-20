import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardSummary } from '../../interfaces/dashboard.interfaces';
import { WORK_ORDER_STATUS_META } from '../../../../shared/constants/work-order-status';
import { StatTile } from '../../../../shared/components/stat-tile/stat-tile';
import { TrendChart } from '../../../../shared/components/trend-chart/trend-chart';
import { StatusBreakdown } from '../../../../shared/components/status-breakdown/status-breakdown';
import { daysUntil, formatCompactNumber, formatCurrencyBRL, formatShortDate } from '../../../../shared/utils/format.util';

@Component({
  selector: 'app-dashboard-home',
  imports: [RouterLink, MatIconModule, MatButtonModule, StatTile, TrendChart, StatusBreakdown],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.scss',
})
export class DashboardHome {
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);

  readonly currentUser = this.authService.currentUser;

  readonly summary = signal<DashboardSummary | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  });

  readonly firstName = computed(() => this.currentUser()?.name.split(' ')[0] ?? '');

  constructor() {
    this.loadSummary();
  }

  loadSummary(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.dashboardService.getSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
      },
    });
  }

  statusLabel(status: string): string {
    return WORK_ORDER_STATUS_META[status]?.label ?? status;
  }

  lowStockSeverity(quantityInStock: number): 'critical' | 'warning' {
    return quantityInStock <= 0 ? 'critical' : 'warning';
  }

  warrantyUrgency(warrantyUntil: string): 'soon' | 'normal' {
    return daysUntil(warrantyUntil) <= 7 ? 'soon' : 'normal';
  }

  formatCurrency(value: number): string {
    return formatCurrencyBRL(value);
  }

  formatCompact(value: number): string {
    return formatCompactNumber(value);
  }

  formatShort(value: string): string {
    return formatShortDate(value);
  }

  daysUntilLabel(value: string): string {
    const days = daysUntil(value);
    if (days <= 0) return 'vence hoje';
    if (days === 1) return 'vence amanhã';
    return `vence em ${days} dias`;
  }
}
