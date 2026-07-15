import { Component, computed, input } from '@angular/core';
import { DashboardStatusCount } from '../../interfaces/dashboard.interfaces';
import { WORK_ORDER_STATUS_META } from '../../constants/work-order-status';

interface StatusRow {
  status: string;
  label: string;
  colorVar: string;
  count: number;
  widthPercent: number;
}

@Component({
  selector: 'app-status-breakdown',
  imports: [],
  templateUrl: './status-breakdown.html',
  styleUrl: './status-breakdown.scss',
})
export class StatusBreakdown {
  readonly data = input.required<DashboardStatusCount[]>();

  readonly total = computed(() => this.data().reduce((sum, item) => sum + item.count, 0));

  readonly rows = computed<StatusRow[]>(() => {
    const items = this.data();
    const maxCount = Math.max(...items.map((item) => item.count), 1);

    return items.map((item) => {
      const meta = WORK_ORDER_STATUS_META[item.status];
      return {
        status: item.status,
        label: meta?.label ?? item.status,
        colorVar: meta?.colorVar ?? '--chart-1',
        count: item.count,
        widthPercent: (item.count / maxCount) * 100,
      };
    });
  });
}
