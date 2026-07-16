import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Category, CategoryType, CreateCategoryPayload, UpdateCategoryPayload } from '../interfaces/inventory.interfaces';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly baseUrl = `${environment.apiUrl}/categories`;

  constructor(private readonly http: HttpClient) {}

  list(type?: CategoryType): Observable<Category[]> {
    const params = type ? new HttpParams().set('type', type) : undefined;
    return this.http.get<Category[]>(this.baseUrl, { params });
  }

  create(payload: CreateCategoryPayload): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateCategoryPayload): Observable<Category> {
    return this.http.patch<Category>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
