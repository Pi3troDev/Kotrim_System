import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CheckoutResult, Plan, Subscription } from '../interfaces/subscription.interfaces';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  listPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${this.baseUrl}/plans`);
  }

  getMine(): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.baseUrl}/subscriptions/me`);
  }

  checkout(planId: string): Observable<CheckoutResult> {
    return this.http.post<CheckoutResult>(`${this.baseUrl}/subscriptions/checkout`, { planId });
  }
}
