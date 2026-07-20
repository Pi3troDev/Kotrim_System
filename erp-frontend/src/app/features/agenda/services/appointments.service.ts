import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginatedResult, PaginationQuery } from '../../../shared/interfaces/pagination.interface';
import { Appointment, AppointmentStatus, CreateAppointmentPayload, UpdateAppointmentPayload } from '../interfaces/appointment.interfaces';

export interface AppointmentQuery extends PaginationQuery {
  from?: string;
  to?: string;
  employeeId?: string;
  status?: AppointmentStatus;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly baseUrl = `${environment.apiUrl}/appointments`;

  constructor(private readonly http: HttpClient) {}

  list(query: AppointmentQuery): Observable<PaginatedResult<Appointment>> {
    let params = new HttpParams().set('page', query.page).set('limit', query.limit);
    if (query.search) params = params.set('search', query.search);
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.employeeId) params = params.set('employeeId', query.employeeId);
    if (query.status) params = params.set('status', query.status);
    return this.http.get<PaginatedResult<Appointment>>(this.baseUrl, { params });
  }

  get(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateAppointmentPayload): Observable<Appointment> {
    return this.http.post<Appointment>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateAppointmentPayload): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
