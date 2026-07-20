import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StatTile } from '../../../../shared/components/stat-tile/stat-tile';
import { AdminService } from '../../services/admin.service';
import { AdminMailLogRow, AdminMailStats, MailStatus } from '../../interfaces/admin.interfaces';
import { AdminTabs } from '../../components/admin-tabs/admin-tabs';
import { MatDialog } from '@angular/material/dialog';
import { MailPreviewDialog } from '../../components/mail-preview-dialog/mail-preview-dialog';

const STATUS_LABELS: Record<MailStatus, string> = {
  SENT: 'Enviado',
  FAILED: 'Falhou',
  RESENT: 'Reenviado',
};

/**
 * The notification centre: every message the system tried to send.
 *
 * Exists for the question support actually gets — "o cliente diz que não recebeu
 * o e-mail" — which is unanswerable without a record of what left the building.
 */
@Component({
  selector: 'app-admin-mail-logs-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    StatTile,
    AdminTabs,
  ],
  templateUrl: './admin-mail-logs.html',
  styleUrl: './admin-mail-logs.scss',
})
export class AdminMailLogsPage implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['createdAt', 'template', 'to', 'company', 'status', 'provider', 'actions'];
  readonly statusOptions: MailStatus[] = ['SENT', 'FAILED', 'RESENT'];

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<MailStatus | ''>('', { nonNullable: true });

  readonly logs = signal<AdminMailLogRow[]>([]);
  readonly stats = signal<AdminMailStats | null>(null);
  readonly total = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.pageIndex.set(0);
        this.load();
      });

    this.statusControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.pageIndex.set(0);
      this.load();
    });
  }

  ngOnInit(): void {
    this.load();
    this.loadStats();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.adminService
      .listMailLogs({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        search: this.searchControl.value || undefined,
        status: this.statusControl.value || undefined,
      })
      .subscribe({
        next: (result) => {
          this.logs.set(result.data);
          this.total.set(result.meta.total);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.hasError.set(true);
        },
      });
  }

  loadStats(): void {
    this.adminService.getMailStats().subscribe({
      next: (stats) => this.stats.set(stats),
      // Non-fatal: the tiles hide, the table still works.
      error: () => this.stats.set(null),
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  /** Opens the rendered message, with the resend action beside it. */
  open(log: AdminMailLogRow): void {
    this.dialog
      .open(MailPreviewDialog, { data: { log }, width: '820px', maxWidth: '92vw' })
      .afterClosed()
      .subscribe((resent) => {
        if (resent) this.refresh();
      });
  }

  private refresh(): void {
    this.load();
    this.loadStats();
  }

  statusLabel(status: MailStatus): string {
    return STATUS_LABELS[status] ?? status;
  }
}
