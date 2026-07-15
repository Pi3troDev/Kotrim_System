import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthSession,
  AuthenticatedUser,
  LoginPayload,
  RegisterCompanyPayload,
} from '../../features/auth/interfaces/auth.interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly accessToken = signal<string | null>(null);
  private readonly user = signal<AuthenticatedUser | null>(null);

  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => this.accessToken() !== null);

  constructor(private readonly http: HttpClient) {}

  getAccessToken(): string | null {
    return this.accessToken();
  }

  login(payload: LoginPayload): Observable<AuthSession> {
    return this.http
      .post<AuthSession>(`${environment.apiUrl}/auth/login`, payload, { withCredentials: true })
      .pipe(tap((session) => this.setSession(session)));
  }

  registerCompany(payload: RegisterCompanyPayload): Observable<AuthSession> {
    return this.http
      .post<AuthSession>(`${environment.apiUrl}/auth/register-company`, payload, {
        withCredentials: true,
      })
      .pipe(tap((session) => this.setSession(session)));
  }

  /** Exchanges the httpOnly refresh cookie for a new access token — used on app bootstrap. */
  refreshSession(): Observable<AuthSession> {
    return this.http
      .post<AuthSession>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(tap((session) => this.setSession(session)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.clearSession()));
  }

  setSession(session: AuthSession): void {
    this.accessToken.set(session.accessToken);
    this.user.set(session.user);
  }

  clearSession(): void {
    this.accessToken.set(null);
    this.user.set(null);
  }
}
