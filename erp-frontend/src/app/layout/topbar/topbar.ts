import { Component, DestroyRef, OnInit, inject, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { interval, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationsService } from '../../shared/services/notifications.service';
import { AppNotification } from '../../shared/interfaces/notification.interface';

const UNREAD_COUNT_POLL_MS = 60_000;

@Component({
  selector: 'app-topbar',
  imports: [DatePipe, MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule, MatBadgeModule, MatProgressSpinnerModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationsService = inject(NotificationsService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly themeService = inject(ThemeService);

  readonly menuToggle = output<void>();

  readonly currentUser = this.authService.currentUser;

  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly isLoadingNotifications = signal(false);

  ngOnInit(): void {
    interval(UNREAD_COUNT_POLL_MS)
      .pipe(startWith(0), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadUnreadCount());
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  logout(): void {
    this.authService.logout().subscribe(() => void this.router.navigateByUrl('/auth/login'));
  }

  initials(): string {
    const name = this.currentUser()?.name ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  loadUnreadCount(): void {
    this.notificationsService.unreadCount().subscribe({ next: ({ count }) => this.unreadCount.set(count), error: () => {} });
  }

  onNotificationsMenuOpened(): void {
    this.isLoadingNotifications.set(true);
    this.notificationsService.list().subscribe({
      next: (notifications) => {
        this.notifications.set(notifications);
        this.isLoadingNotifications.set(false);
      },
      error: () => this.isLoadingNotifications.set(false),
    });
  }

  onNotificationClick(notification: AppNotification): void {
    if (!notification.isRead) {
      this.notificationsService.markAsRead(notification.id).subscribe({
        next: () => {
          this.notifications.update((list) =>
            list.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
          );
          this.unreadCount.update((count) => Math.max(0, count - 1));
        },
        error: () => {},
      });
    }

    if (notification.link) {
      void this.router.navigateByUrl(notification.link);
    }
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update((list) => list.map((item) => ({ ...item, isRead: true })));
        this.unreadCount.set(0);
      },
      error: () => {},
    });
  }
}
