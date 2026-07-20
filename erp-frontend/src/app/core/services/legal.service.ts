import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActiveLegalDocuments, PendingLegalDocument } from '../interfaces/legal.interfaces';

@Injectable({ providedIn: 'root' })
export class LegalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** Public — used by /termos, /privacidade and the registration page, logged in or not. */
  getDocuments(): Observable<ActiveLegalDocuments> {
    return this.http.get<ActiveLegalDocuments>(`${this.baseUrl}/legal/documents`);
  }

  getPending(): Observable<{ pending: PendingLegalDocument[] }> {
    return this.http.get<{ pending: PendingLegalDocument[] }>(`${this.baseUrl}/legal/pending`);
  }

  accept(documentIds: string[]): Observable<{ ok: true }> {
    return this.http.post<{ ok: true }>(`${this.baseUrl}/legal/accept`, { documentIds });
  }

  /** Triggers a browser download of the company's full data export. */
  downloadDataExport(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/legal/data-export`, { responseType: 'blob' });
  }
}
