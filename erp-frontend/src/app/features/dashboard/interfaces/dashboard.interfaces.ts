import { MonthlyTrendPoint, StatusCount } from '../../../shared/interfaces/chart-data.interfaces';

export interface DashboardKpi {
  value: number;
  previousValue: number;
  deltaPercent: number;
}

export interface DashboardLowStockItem {
  id: string;
  name: string;
  quantityInStock: number;
  minimumStock: number;
}

export interface DashboardWarrantyItem {
  id: string;
  workOrderNumber: number;
  clientName: string;
  vehicleLabel: string;
  warrantyUntil: string;
}

export interface DashboardRecentWorkOrder {
  id: string;
  number: number;
  clientName: string;
  vehicleLabel: string;
  status: string;
  totalAmount: number;
  openedAt: string;
}

/**
 * Mirrors the backend shape: the financial and stock sections are `null` — not
 * zero — when the plan does not include FINANCE / INVENTORY, and the backend
 * skips those queries entirely. Rendering a R$ 0,00 there would tell an
 * Essencial customer their revenue is zero, which is a lie.
 */
export interface DashboardSummary {
  openWorkOrders: { value: number };
  completedWorkOrders: DashboardKpi;
  todayAppointments: { value: number };
  vehiclesInShop: { value: number };
  statusBreakdown: StatusCount[];
  upcomingWarranties: DashboardWarrantyItem[];
  recentWorkOrders: DashboardRecentWorkOrder[];

  revenue: DashboardKpi | null;
  expenses: DashboardKpi | null;
  profit: DashboardKpi | null;
  monthlySeries: MonthlyTrendPoint[] | null;

  lowStockItems: DashboardLowStockItem[] | null;
  lowStockCount: number | null;
}
