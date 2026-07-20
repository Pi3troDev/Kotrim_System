export interface DashboardKpi {
  value: number;
  previousValue: number;
  deltaPercent: number;
}

export interface DashboardStatusCount {
  status: string;
  count: number;
}

export interface DashboardMonthPoint {
  month: string;
  label: string;
  revenue: number;
  expenses: number;
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
 * The financial and stock sections are `null` — not zero, not empty — when the
 * company's plan does not include FINANCE / INVENTORY. Null says "you do not
 * have this module"; a zero would say "you have it and it is empty", which
 * would put a misleading R$ 0,00 on an Essencial dashboard.
 *
 * The backend skips those queries entirely in that case, so this is not just a
 * presentation concern.
 */
export interface DashboardSummary {
  // Operational — every plan.
  openWorkOrders: { value: number };
  completedWorkOrders: DashboardKpi;
  todayAppointments: { value: number };
  vehiclesInShop: { value: number };
  statusBreakdown: DashboardStatusCount[];
  upcomingWarranties: DashboardWarrantyItem[];
  recentWorkOrders: DashboardRecentWorkOrder[];

  // Requires PlanFeature.FINANCE.
  revenue: DashboardKpi | null;
  expenses: DashboardKpi | null;
  profit: DashboardKpi | null;
  monthlySeries: DashboardMonthPoint[] | null;

  // Requires PlanFeature.INVENTORY.
  lowStockItems: DashboardLowStockItem[] | null;
  lowStockCount: number | null;
}
