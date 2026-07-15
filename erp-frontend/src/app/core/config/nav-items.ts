export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  { label: 'Clientes', icon: 'group', route: '/clients' },
  { label: 'Veículos', icon: 'directions_car', route: '/vehicles' },
  { label: 'Ordens de Serviço', icon: 'build', route: '/work-orders' },
  { label: 'Estoque', icon: 'inventory_2', route: '/inventory' },
  { label: 'Financeiro', icon: 'payments', route: '/finance' },
  { label: 'Funcionários', icon: 'badge', route: '/employees' },
  { label: 'Relatórios', icon: 'bar_chart', route: '/reports' },
  { label: 'Configurações', icon: 'settings', route: '/settings' },
];
