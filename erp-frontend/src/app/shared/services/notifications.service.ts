import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppNotification } from '../interfaces/notification.interface';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  constructor(private readonly http: HttpClient) {}

  list(limit = 20): Observable<AppNotification[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<AppNotification[]>(this.baseUrl, { params });
  }

  unreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/unread-count`);
  }

  markAsRead(id: string): Observable<AppNotification> {
    return this.http.patch<AppNotification>(`${this.baseUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<{ count: number }> {
    return this.http.patch<{ count: number }>(`${this.baseUrl}/read-all`, {});
  }
}
