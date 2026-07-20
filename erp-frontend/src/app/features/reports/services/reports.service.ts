import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FinanceReport, InventoryReport, WorkOrdersReport } from '../interfaces/report.interfaces';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly baseUrl = `${environment.apiUrl}/reports`;

  constructor(private readonly http: HttpClient) {}

  getFinanceReport(from: string, to: string): Observable<FinanceReport> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<FinanceReport>(`${this.baseUrl}/finance`, { params });
  }

  getWorkOrdersReport(from: string, to: string): Observable<WorkOrdersReport> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<WorkOrdersReport>(`${this.baseUrl}/work-orders`, { params });
  }

  getInventoryReport(from: string, to: string): Observable<InventoryReport> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<InventoryReport>(`${this.baseUrl}/inventory`, { params });
  }
}
