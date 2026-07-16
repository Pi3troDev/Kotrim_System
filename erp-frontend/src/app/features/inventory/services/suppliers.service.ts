import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginatedResult, PaginationQuery } from '../../../shared/interfaces/pagination.interface';
import { CreateSupplierPayload, Supplier, UpdateSupplierPayload } from '../interfaces/inventory.interfaces';

@Injectable({ providedIn: 'root' })
export class SuppliersService {
  private readonly baseUrl = `${environment.apiUrl}/suppliers`;

  constructor(private readonly http: HttpClient) {}

  list(query: PaginationQuery): Observable<PaginatedResult<Supplier>> {
    let params = new HttpParams().set('page', query.page).set('limit', query.limit);
    if (query.search) {
      params = params.set('search', query.search);
    }
    return this.http.get<PaginatedResult<Supplier>>(this.baseUrl, { params });
  }

  get(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateSupplierPayload): Observable<Supplier> {
    return this.http.post<Supplier>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateSupplierPayload): Observable<Supplier> {
    return this.http.patch<Supplier>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
