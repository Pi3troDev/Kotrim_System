import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginatedResult, PaginationQuery } from '../../../shared/interfaces/pagination.interface';
import {
  CreateInventoryItemPayload,
  CreateStockMovementPayload,
  InventoryItem,
  StockMovement,
  UpdateInventoryItemPayload,
} from '../interfaces/inventory.interfaces';

export interface InventoryItemQuery extends PaginationQuery {
  categoryId?: string;
  supplierId?: string;
  lowStockOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class InventoryItemsService {
  private readonly baseUrl = `${environment.apiUrl}/inventory`;

  constructor(private readonly http: HttpClient) {}

  list(query: InventoryItemQuery): Observable<PaginatedResult<InventoryItem>> {
    let params = new HttpParams().set('page', query.page).set('limit', query.limit);
    if (query.search) params = params.set('search', query.search);
    if (query.categoryId) params = params.set('categoryId', query.categoryId);
    if (query.supplierId) params = params.set('supplierId', query.supplierId);
    if (query.lowStockOnly) params = params.set('lowStockOnly', 'true');
    return this.http.get<PaginatedResult<InventoryItem>>(this.baseUrl, { params });
  }

  get(id: string): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateInventoryItemPayload): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateInventoryItemPayload): Observable<InventoryItem> {
    return this.http.patch<InventoryItem>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  createMovement(id: string, payload: CreateStockMovementPayload): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${this.baseUrl}/${id}/movements`, payload);
  }

  listMovements(id: string): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${this.baseUrl}/${id}/movements`);
  }
}
