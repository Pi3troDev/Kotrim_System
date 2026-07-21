import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CargoOption, InviteTeamMemberPayload, TeamMember, UpdateTeamMemberPayload } from '../interfaces/team.interfaces';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly baseUrl = `${environment.apiUrl}/team-members`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(this.baseUrl);
  }

  listCargos(): Observable<CargoOption[]> {
    return this.http.get<CargoOption[]>(`${this.baseUrl}/cargos`);
  }

  invite(payload: InviteTeamMemberPayload): Observable<TeamMember> {
    return this.http.post<TeamMember>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateTeamMemberPayload): Observable<TeamMember> {
    return this.http.patch<TeamMember>(`${this.baseUrl}/${id}`, payload);
  }
}
