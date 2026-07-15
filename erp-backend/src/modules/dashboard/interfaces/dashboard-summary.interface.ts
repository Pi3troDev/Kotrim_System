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

export interface DashboardSummary {
  openWorkOrders: { value: number };
  completedWorkOrders: DashboardKpi;
  revenue: DashboardKpi;
  expenses: DashboardKpi;
  profit: DashboardKpi;
  statusBreakdown: DashboardStatusCount[];
  monthlySeries: DashboardMonthPoint[];
  lowStockItems: DashboardLowStockItem[];
  lowStockCount: number;
  upcomingWarranties: DashboardWarrantyItem[];
  recentWorkOrders: DashboardRecentWorkOrder[];
}
