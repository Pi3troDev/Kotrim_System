import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginatedResult, PaginationQuery } from '../../../shared/interfaces/pagination.interface';
import { CreateVehiclePayload, UpdateVehiclePayload, Vehicle } from '../interfaces/vehicle.interfaces';

export interface VehicleQuery extends PaginationQuery {
  clientId?: string;
}

@Injectable({ providedIn: 'root' })
export class VehiclesService {
  private readonly baseUrl = `${environment.apiUrl}/vehicles`;

  constructor(private readonly http: HttpClient) {}

  list(query: VehicleQuery): Observable<PaginatedResult<Vehicle>> {
    let params = new HttpParams().set('page', query.page).set('limit', query.limit);
    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.clientId) {
      params = params.set('clientId', query.clientId);
    }
    return this.http.get<PaginatedResult<Vehicle>>(this.baseUrl, { params });
  }

  get(id: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateVehiclePayload): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateVehiclePayload): Observable<Vehicle> {
    return this.http.patch<Vehicle>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
