import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginatedResult, PaginationQuery } from '../../../shared/interfaces/pagination.interface';
import {
  CreateWorkOrderItemPayload,
  CreateWorkOrderPayload,
  UpdateWorkOrderItemPayload,
  UpdateWorkOrderPayload,
  UpdateWorkOrderStatusPayload,
  WorkOrder,
  WorkOrderListItem,
  WorkOrderStatus,
} from '../interfaces/work-order.interfaces';

export interface WorkOrderQuery extends PaginationQuery {
  status?: WorkOrderStatus;
  clientId?: string;
  vehicleId?: string;
}

@Injectable({ providedIn: 'root' })
export class WorkOrdersService {
  private readonly baseUrl = `${environment.apiUrl}/work-orders`;

  constructor(private readonly http: HttpClient) {}

  list(query: WorkOrderQuery): Observable<PaginatedResult<WorkOrderListItem>> {
    let params = new HttpParams().set('page', query.page).set('limit', query.limit);
    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);
    if (query.clientId) params = params.set('clientId', query.clientId);
    if (query.vehicleId) params = params.set('vehicleId', query.vehicleId);
    return this.http.get<PaginatedResult<WorkOrderListItem>>(this.baseUrl, { params });
  }

  get(id: string): Observable<WorkOrder> {
    return this.http.get<WorkOrder>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateWorkOrderPayload): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateWorkOrderPayload): Observable<WorkOrder> {
    return this.http.patch<WorkOrder>(`${this.baseUrl}/${id}`, payload);
  }

  updateStatus(id: string, payload: UpdateWorkOrderStatusPayload): Observable<WorkOrder> {
    return this.http.patch<WorkOrder>(`${this.baseUrl}/${id}/status`, payload);
  }

  addItem(id: string, payload: CreateWorkOrderItemPayload): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(`${this.baseUrl}/${id}/items`, payload);
  }

  updateItem(id: string, itemId: string, payload: UpdateWorkOrderItemPayload): Observable<WorkOrder> {
    return this.http.patch<WorkOrder>(`${this.baseUrl}/${id}/items/${itemId}`, payload);
  }

  removeItem(id: string, itemId: string): Observable<WorkOrder> {
    return this.http.delete<WorkOrder>(`${this.baseUrl}/${id}/items/${itemId}`);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
