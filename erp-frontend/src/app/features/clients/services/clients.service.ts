import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginatedResult, PaginationQuery } from '../../../shared/interfaces/pagination.interface';
import { Client, CreateClientPayload, UpdateClientPayload } from '../interfaces/client.interfaces';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly baseUrl = `${environment.apiUrl}/clients`;

  constructor(private readonly http: HttpClient) {}

  list(query: PaginationQuery): Observable<PaginatedResult<Client>> {
    let params = new HttpParams().set('page', query.page).set('limit', query.limit);
    if (query.search) {
      params = params.set('search', query.search);
    }
    return this.http.get<PaginatedResult<Client>>(this.baseUrl, { params });
  }

  get(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateClientPayload): Observable<Client> {
    return this.http.post<Client>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateClientPayload): Observable<Client> {
    return this.http.patch<Client>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
