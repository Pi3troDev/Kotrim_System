import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UpdateProfilePayload, UserProfile } from '../interfaces/settings.interfaces';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly baseUrl = `${environment.apiUrl}/users`;

  constructor(private readonly http: HttpClient) {}

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/me`);
  }

  updateMe(payload: UpdateProfilePayload): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.baseUrl}/me`, payload);
  }

  uploadAvatar(file: File): Observable<UserProfile> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UserProfile>(`${this.baseUrl}/me/avatar`, formData);
  }
}
