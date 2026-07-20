import { MonthlyTrendPoint, StatusCount } from '../../../shared/interfaces/chart-data.interfaces';

export interface CategoryBreakdownRow {
  categoryId: string | null;
  categoryName: string;
  total: number;
  percent: number;
}

export interface FinanceReport {
  totals: { income: number; expense: number; balance: number };
  monthlySeries: MonthlyTrendPoint[];
  expensesByCategory: CategoryBreakdownRow[];
  incomesByCategory: CategoryBreakdownRow[];
}

export interface MechanicRankingRow {
  employeeId: string;
  employeeName: string;
  completedCount: number;
  revenue: number;
}

export interface WorkOrdersReport {
  totals: { completedCount: number; revenue: number; averageTicket: number };
  statusBreakdown: StatusCount[];
  mechanicRanking: MechanicRankingRow[];
}

export interface LowStockReportItem {
  id: string;
  name: string;
  quantityInStock: number;
  minimumStock: number;
}

export interface MostMovedReportItem {
  inventoryItemId: string;
  name: string;
  totalIn: number;
  totalOut: number;
}

export interface InventoryReport {
  totals: { stockValue: number; lowStockCount: number; activeItemsCount: number };
  lowStockItems: LowStockReportItem[];
  mostMovedItems: MostMovedReportItem[];
}
