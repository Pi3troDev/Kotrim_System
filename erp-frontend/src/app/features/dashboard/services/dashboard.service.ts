import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardSummary } from '../interfaces/dashboard.interfaces';

// TEMP: no backend/database connected yet — preview data so the dashboard is
// visible without a live API. Remove PREVIEW_SUMMARY and the branch below
// once the backend is wired up to a real database.
const PREVIEW_SUMMARY: DashboardSummary = {
  openWorkOrders: { value: 14 },
  completedWorkOrders: { value: 23, previousValue: 18, deltaPercent: 27.8 },
  revenue: { value: 48250, previousValue: 39900, deltaPercent: 20.9 },
  expenses: { value: 18320, previousValue: 21100, deltaPercent: -13.2 },
  profit: { value: 29930, previousValue: 18800, deltaPercent: 59.2 },
  statusBreakdown: [
    { status: 'OPEN', count: 6 },
    { status: 'IN_DIAGNOSIS', count: 3 },
    { status: 'WAITING_APPROVAL', count: 2 },
    { status: 'IN_PROGRESS', count: 4 },
    { status: 'WAITING_PARTS', count: 1 },
    { status: 'COMPLETED', count: 23 },
    { status: 'DELIVERED', count: 19 },
    { status: 'CANCELLED', count: 2 },
  ],
  monthlySeries: [
    { month: '2026-02', label: 'Fev', revenue: 28400, expenses: 15200 },
    { month: '2026-03', label: 'Mar', revenue: 31200, expenses: 16800 },
    { month: '2026-04', label: 'Abr', revenue: 35900, expenses: 17650 },
    { month: '2026-05', label: 'Mai', revenue: 33100, expenses: 19200 },
    { month: '2026-06', label: 'Jun', revenue: 39900, expenses: 21100 },
    { month: '2026-07', label: 'Jul', revenue: 48250, expenses: 18320 },
  ],
  lowStockItems: [
    { id: '1', name: 'Óleo Motor 5W30 (1L)', quantityInStock: 2, minimumStock: 10 },
    { id: '2', name: 'Pastilha de Freio Dianteira', quantityInStock: 0, minimumStock: 4 },
    { id: '3', name: 'Filtro de Ar', quantityInStock: 3, minimumStock: 6 },
    { id: '4', name: 'Correia Dentada', quantityInStock: 1, minimumStock: 3 },
  ],
  lowStockCount: 4,
  upcomingWarranties: [
    {
      id: '1',
      workOrderNumber: 1042,
      clientName: 'Carlos Mendes',
      vehicleLabel: 'Fiat Argo · ABC1D23',
      warrantyUntil: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    },
    {
      id: '2',
      workOrderNumber: 1039,
      clientName: 'Fernanda Lima',
      vehicleLabel: 'VW Gol · XYZ9K88',
      warrantyUntil: new Date(Date.now() + 12 * 86_400_000).toISOString(),
    },
    {
      id: '3',
      workOrderNumber: 1035,
      clientName: 'Roberto Alves',
      vehicleLabel: 'Chevrolet Onix · JJK4L02',
      warrantyUntil: new Date(Date.now() + 25 * 86_400_000).toISOString(),
    },
  ],
  recentWorkOrders: [
    {
      id: '1',
      number: 1048,
      clientName: 'Ana Paula Rocha',
      vehicleLabel: 'Honda Civic · QWE1R23',
      status: 'IN_PROGRESS',
      totalAmount: 1280,
      openedAt: new Date().toISOString(),
    },
    {
      id: '2',
      number: 1047,
      clientName: 'Marcos Vinícius',
      vehicleLabel: 'Toyota Corolla · RTY2P90',
      status: 'OPEN',
      totalAmount: 450,
      openedAt: new Date(Date.now() - 86_400_000).toISOString(),
    },
    {
      id: '3',
      number: 1046,
      clientName: 'Juliana Prado',
      vehicleLabel: 'Jeep Renegade · MNB3X10',
      status: 'COMPLETED',
      totalAmount: 2100,
      openedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    },
  ],
};

const USE_PREVIEW_DATA = true;

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  getSummary(): Observable<DashboardSummary> {
    if (USE_PREVIEW_DATA) {
      return of(PREVIEW_SUMMARY);
    }
    return this.http.get<DashboardSummary>(`${environment.apiUrl}/dashboard/summary`);
  }
}
