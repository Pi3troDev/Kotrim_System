import { PlanFeature } from '../../features/subscription/interfaces/subscription.interfaces';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  /** Hidden unless the company's plan includes this feature. */
  feature?: PlanFeature;
  /** Kotrim platform staff only — hidden from every workshop user. */
  superAdminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', feature: 'DASHBOARD' },
  { label: 'Clientes', icon: 'group', route: '/clients', feature: 'CLIENTS' },
  { label: 'Veículos', icon: 'directions_car', route: '/vehicles', feature: 'VEHICLES' },
  { label: 'Ordens de Serviço', icon: 'build', route: '/work-orders', feature: 'WORK_ORDERS' },
  { label: 'Estoque', icon: 'inventory_2', route: '/inventory', feature: 'INVENTORY' },
  { label: 'Financeiro', icon: 'payments', route: '/finance', feature: 'FINANCE' },
  { label: 'Funcionários', icon: 'badge', route: '/employees', feature: 'EMPLOYEES' },
  { label: 'Agenda', icon: 'event', route: '/agenda', feature: 'AGENDA' },
  { label: 'Relatórios', icon: 'bar_chart', route: '/reports', feature: 'REPORTS' },
  // No `feature` gate: every login, regardless of cargo, can always reach
  // their own profile and preferences here — see settings.routes.ts, where
  // only the Empresa/Equipe tabs (not this entry point) require SETTINGS.
  { label: 'Configurações', icon: 'settings', route: '/settings' },
  { label: 'Painel Kotrim', icon: 'admin_panel_settings', route: '/admin', superAdminOnly: true },
];
