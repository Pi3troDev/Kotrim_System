import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginatedResult, PaginationQuery } from '../../../shared/interfaces/pagination.interface';
import { CreateEmployeePayload, Employee, UpdateEmployeePayload } from '../interfaces/employee.interfaces';

export interface EmployeeQuery extends PaginationQuery {
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class EmployeesService {
  private readonly baseUrl = `${environment.apiUrl}/employees`;

  constructor(private readonly http: HttpClient) {}

  list(query: EmployeeQuery): Observable<PaginatedResult<Employee>> {
    let params = new HttpParams().set('page', query.page).set('limit', query.limit);
    if (query.search) params = params.set('search', query.search);
    if (query.isActive !== undefined) params = params.set('isActive', String(query.isActive));
    return this.http.get<PaginatedResult<Employee>>(this.baseUrl, { params });
  }

  get(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateEmployeePayload): Observable<Employee> {
    return this.http.post<Employee>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateEmployeePayload): Observable<Employee> {
    return this.http.patch<Employee>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
