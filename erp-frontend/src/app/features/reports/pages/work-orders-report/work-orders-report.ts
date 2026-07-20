import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatTile } from '../../../../shared/components/stat-tile/stat-tile';
import { StatusBreakdown } from '../../../../shared/components/status-breakdown/status-breakdown';
import { ReportsTabs } from '../../components/reports-tabs/reports-tabs';
import { DateRange, DateRangeFilter } from '../../components/date-range-filter/date-range-filter';
import { ReportsService } from '../../services/reports.service';
import { WorkOrdersReport } from '../../interfaces/report.interfaces';

@Component({
  selector: 'app-work-orders-report-page',
  imports: [CurrencyPipe, MatIconModule, MatProgressSpinnerModule, StatTile, StatusBreakdown, ReportsTabs, DateRangeFilter],
  templateUrl: './work-orders-report.html',
  styleUrl: './work-orders-report.scss',
})
export class WorkOrdersReportPage implements OnInit {
  private readonly reportsService = inject(ReportsService);

  readonly from = signal(startOfMonth());
  readonly to = signal(new Date());
  readonly report = signal<WorkOrdersReport | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  ngOnInit(): void {
    this.load();
  }

  onRangeChange(range: DateRange): void {
    this.from.set(range.from);
    this.to.set(range.to);
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.reportsService.getWorkOrdersReport(this.toIsoDate(this.from()), this.toIsoDate(this.to())).subscribe({
      next: (report) => {
        this.report.set(report);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
      },
    });
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
