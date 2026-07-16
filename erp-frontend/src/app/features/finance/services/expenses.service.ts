import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginatedResult, PaginationQuery } from '../../../shared/interfaces/pagination.interface';
import {
  CreateExpensePayload,
  CreatePaymentPayload,
  Expense,
  ExpensesSummary,
  FinancialStatus,
  Payment,
  UpdateExpensePayload,
  UpdateExpenseStatusPayload,
} from '../interfaces/finance.interfaces';

export interface ExpenseQuery extends PaginationQuery {
  status?: FinancialStatus;
  categoryId?: string;
}

@Injectable({ providedIn: 'root' })
export class ExpensesService {
  private readonly baseUrl = `${environment.apiUrl}/expenses`;

  constructor(private readonly http: HttpClient) {}

  list(query: ExpenseQuery): Observable<PaginatedResult<Expense>> {
    let params = new HttpParams().set('page', query.page).set('limit', query.limit);
    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);
    if (query.categoryId) params = params.set('categoryId', query.categoryId);
    return this.http.get<PaginatedResult<Expense>>(this.baseUrl, { params });
  }

  summary(): Observable<ExpensesSummary> {
    return this.http.get<ExpensesSummary>(`${this.baseUrl}/summary`);
  }

  get(id: string): Observable<Expense> {
    return this.http.get<Expense>(`${this.baseUrl}/${id}`);
  }

  /** Always returns an array — more than one row when `installments` was set. */
  create(payload: CreateExpensePayload): Observable<Expense[]> {
    return this.http.post<Expense[]>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateExpensePayload): Observable<Expense> {
    return this.http.patch<Expense>(`${this.baseUrl}/${id}`, payload);
  }

  updateStatus(id: string, payload: UpdateExpenseStatusPayload): Observable<Expense> {
    return this.http.patch<Expense>(`${this.baseUrl}/${id}/status`, payload);
  }

  stopRecurrence(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/stop-recurrence`, {});
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  addPayment(id: string, payload: CreatePaymentPayload): Observable<Expense> {
    return this.http.post<Expense>(`${this.baseUrl}/${id}/payments`, payload);
  }

  listPayments(id: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/${id}/payments`);
  }

  removePayment(id: string, paymentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/payments/${paymentId}`);
  }
}
