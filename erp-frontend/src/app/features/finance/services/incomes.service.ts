import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginatedResult, PaginationQuery } from '../../../shared/interfaces/pagination.interface';
import {
  CreateIncomePayload,
  CreatePaymentPayload,
  FinancialStatus,
  Income,
  IncomesSummary,
  Payment,
  UpdateIncomePayload,
  UpdateIncomeStatusPayload,
} from '../interfaces/finance.interfaces';

export interface IncomeQuery extends PaginationQuery {
  status?: FinancialStatus;
  categoryId?: string;
  clientId?: string;
}

@Injectable({ providedIn: 'root' })
export class IncomesService {
  private readonly baseUrl = `${environment.apiUrl}/incomes`;

  constructor(private readonly http: HttpClient) {}

  list(query: IncomeQuery): Observable<PaginatedResult<Income>> {
    let params = new HttpParams().set('page', query.page).set('limit', query.limit);
    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);
    if (query.categoryId) params = params.set('categoryId', query.categoryId);
    if (query.clientId) params = params.set('clientId', query.clientId);
    return this.http.get<PaginatedResult<Income>>(this.baseUrl, { params });
  }

  summary(): Observable<IncomesSummary> {
    return this.http.get<IncomesSummary>(`${this.baseUrl}/summary`);
  }

  get(id: string): Observable<Income> {
    return this.http.get<Income>(`${this.baseUrl}/${id}`);
  }

  /** Always returns an array — more than one row when `installments` was set. */
  create(payload: CreateIncomePayload): Observable<Income[]> {
    return this.http.post<Income[]>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateIncomePayload): Observable<Income> {
    return this.http.patch<Income>(`${this.baseUrl}/${id}`, payload);
  }

  updateStatus(id: string, payload: UpdateIncomeStatusPayload): Observable<Income> {
    return this.http.patch<Income>(`${this.baseUrl}/${id}/status`, payload);
  }

  stopRecurrence(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/stop-recurrence`, {});
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  addPayment(id: string, payload: CreatePaymentPayload): Observable<Income> {
    return this.http.post<Income>(`${this.baseUrl}/${id}/payments`, payload);
  }

  listPayments(id: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/${id}/payments`);
  }

  removePayment(id: string, paymentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/payments/${paymentId}`);
  }
}
