import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CompanySettings, UpdateCompanySettingsPayload } from '../interfaces/settings.interfaces';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly baseUrl = `${environment.apiUrl}/settings`;

  constructor(private readonly http: HttpClient) {}

  getCompany(): Observable<CompanySettings> {
    return this.http.get<CompanySettings>(`${this.baseUrl}/company`);
  }

  updateCompany(payload: UpdateCompanySettingsPayload): Observable<CompanySettings> {
    return this.http.patch<CompanySettings>(`${this.baseUrl}/company`, payload);
  }

  uploadLogo(file: File): Observable<CompanySettings> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<CompanySettings>(`${this.baseUrl}/company/logo`, formData);
  }
}
