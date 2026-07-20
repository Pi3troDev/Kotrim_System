import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminTabs } from '../../components/admin-tabs/admin-tabs';
import { AdminService } from '../../services/admin.service';
import { ServiceState, SystemHealth } from '../../interfaces/admin.interfaces';

const STATE_LABELS: Record<ServiceState, string> = {
  up: 'Funcionando',
  degraded: 'Atenção',
  down: 'Fora do ar',
};

/**
 * Is it working?
 *
 * Every value here was measured by the backend, not declared. A page that says
 * "up" because a constant says so is worse than no page — it turns an outage
 * into confusion.
 */
@Component({
  selector: 'app-admin-health-page',
  imports: [DatePipe, MatIconModule, MatButtonModule, MatProgressSpinnerModule, AdminTabs],
  templateUrl: './admin-health.html',
  styleUrl: './admin-health.scss',
})
export class AdminHealthPage implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly health = signal<SystemHealth | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.adminService.getHealth().subscribe({
      next: (health) => {
        this.health.set(health);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
      },
    });
  }

  stateLabel(state: ServiceState): string {
    return STATE_LABELS[state];
  }

  stateIcon(state: ServiceState): string {
    return state === 'up' ? 'check_circle' : state === 'degraded' ? 'warning' : 'error';
  }

  uptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  }
}
