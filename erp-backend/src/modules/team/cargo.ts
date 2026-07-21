import { PlanFeature } from '../billing/plan-features';

/**
 * Job-title presets an owner can invite a team member as.
 *
 * Deliberately not the free-text `Employee.position` field: a cargo here is a
 * *system Role* with a fixed set of `PlanFeature`s attached, because it decides
 * what a login can see, not just what prints on a payslip. "Admin" is not in
 * this catalogue — it is the role created automatically at registration, and
 * nothing here can create a second one.
 */
export enum Cargo {
  MECANICO = 'MECANICO',
  FINANCEIRO = 'FINANCEIRO',
  RECEPCAO = 'RECEPCAO',
  ESTOQUE = 'ESTOQUE',
}

export const CARGO_LABELS: Readonly<Record<Cargo, string>> = {
  [Cargo.MECANICO]: 'Mecânico',
  [Cargo.FINANCEIRO]: 'Financeiro',
  [Cargo.RECEPCAO]: 'Recepção',
  [Cargo.ESTOQUE]: 'Estoque',
};

/**
 * What each cargo may see. A subset of what the company's *plan* unlocks —
 * the effective access is the intersection (see PlanFeatureGuard) — and never
 * EMPLOYEES: that module carries salaries, and a cargo below Admin has no
 * business reading a coworker's pay.
 */
export const CARGO_FEATURES: Readonly<Record<Cargo, readonly PlanFeature[]>> = {
  [Cargo.MECANICO]: [
    PlanFeature.DASHBOARD,
    PlanFeature.CLIENTS,
    PlanFeature.VEHICLES,
    PlanFeature.WORK_ORDERS,
    PlanFeature.AGENDA,
  ],
  [Cargo.FINANCEIRO]: [PlanFeature.DASHBOARD, PlanFeature.FINANCE, PlanFeature.REPORTS],
  [Cargo.RECEPCAO]: [
    PlanFeature.DASHBOARD,
    PlanFeature.CLIENTS,
    PlanFeature.VEHICLES,
    PlanFeature.WORK_ORDERS,
    PlanFeature.AGENDA,
  ],
  [Cargo.ESTOQUE]: [PlanFeature.DASHBOARD, PlanFeature.INVENTORY],
};

/** The Role.name a cargo is stored under — distinct from its display label, which can be reworded freely. */
export function roleNameForCargo(cargo: Cargo): string {
  return `cargo:${cargo}`;
}

export interface CargoOption {
  key: Cargo;
  label: string;
  features: PlanFeature[];
  /** False when the plan is missing at least one feature this cargo needs. */
  available: boolean;
  /** The first feature blocking availability, for the upgrade prompt. Undefined when available. */
  missingFeature?: PlanFeature;
}

/** Every cargo, marked with whether the given plan features cover what it needs. */
export function listCargoOptions(planFeatures: readonly PlanFeature[]): CargoOption[] {
  return Object.values(Cargo).map((cargo) => {
    const required = CARGO_FEATURES[cargo];
    const missingFeature = required.find((f) => !planFeatures.includes(f));
    return {
      key: cargo,
      label: CARGO_LABELS[cargo],
      features: [...required],
      available: !missingFeature,
      missingFeature,
    };
  });
}
