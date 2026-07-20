import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginatedResult } from '../../../shared/interfaces/pagination.interface';
import { Subscription, SubscriptionStatus } from '../../subscription/interfaces/subscription.interfaces';
import {
  ActivateSubscriptionPayload,
  AdminCompanyDetail,
  AdminCompanyRow,
  AdminStats,
  AdminMailLogRow,
  AdminMailStats,
  ImpersonationSession,
  AdminMetrics,
  SystemHealth,
  MailPreview,
  MailStatus,
  UpdateSubscriptionPayload,
} from '../interfaces/admin.interfaces';

export interface AdminMailLogQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: MailStatus;
}

export interface AdminCompanyQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: SubscriptionStatus;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  listCompanies(query: AdminCompanyQuery): Observable<PaginatedResult<AdminCompanyRow>> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);

    return this.http.get<PaginatedResult<AdminCompanyRow>>(`${this.baseUrl}/companies`, { params });
  }

  getCompany(id: string): Observable<AdminCompanyDetail> {
    return this.http.get<AdminCompanyDetail>(`${this.baseUrl}/companies/${id}`);
  }

  listMailLogs(query: AdminMailLogQuery): Observable<PaginatedResult<AdminMailLogRow>> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);

    return this.http.get<PaginatedResult<AdminMailLogRow>>(`${this.baseUrl}/mail-logs`, { params });
  }

  getMailStats(): Observable<AdminMailStats> {
    return this.http.get<AdminMailStats>(`${this.baseUrl}/mail-stats`);
  }

  /** Starts a read-only support session inside a company. */
  impersonate(companyId: string): Observable<ImpersonationSession> {
    return this.http.post<ImpersonationSession>(`${this.baseUrl}/companies/${companyId}/impersonate`, {});
  }

  /** Closes the support session in the audit trail. */
  endImpersonation(): Observable<{ ok: true }> {
    return this.http.post<{ ok: true }>(`${this.baseUrl}/impersonate/end`, {});
  }

  getMetrics(): Observable<AdminMetrics> {
    return this.http.get<AdminMetrics>(`${this.baseUrl}/metrics`);
  }

  getHealth(): Observable<SystemHealth> {
    return this.http.get<SystemHealth>(`${this.baseUrl}/health`);
  }

  previewMailLog(id: string): Observable<MailPreview> {
    return this.http.get<MailPreview>(`${this.baseUrl}/mail-logs/${id}/preview`);
  }

  resendMailLog(id: string): Observable<{ ok: true }> {
    return this.http.post<{ ok: true }>(`${this.baseUrl}/mail-logs/${id}/resend`, {});
  }

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.baseUrl}/stats`);
  }

  activate(subscriptionId: string, payload: ActivateSubscriptionPayload): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.baseUrl}/subscriptions/${subscriptionId}/activate`, payload);
  }

  cancel(subscriptionId: string): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.baseUrl}/subscriptions/${subscriptionId}/cancel`, {});
  }

  updateDates(subscriptionId: string, payload: UpdateSubscriptionPayload): Observable<Subscription> {
    return this.http.patch<Subscription>(`${this.baseUrl}/subscriptions/${subscriptionId}`, payload);
  }
}
