import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Account, CreateAccountPayload, UpdateAccountPayload } from '../interfaces/finance.interfaces';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly baseUrl = `${environment.apiUrl}/accounts`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Account[]> {
    return this.http.get<Account[]>(this.baseUrl);
  }

  create(payload: CreateAccountPayload): Observable<Account> {
    return this.http.post<Account>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateAccountPayload): Observable<Account> {
    return this.http.patch<Account>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
