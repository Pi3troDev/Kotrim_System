import { PlanFeature } from '../../subscription/interfaces/subscription.interfaces';

export type Cargo = 'MECANICO' | 'FINANCEIRO' | 'RECEPCAO' | 'ESTOQUE';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  /** Null for the company's system Admin — cargos apply only to invited members. */
  cargo: string | null;
  isSystemAdmin: boolean;
  isActive: boolean;
  /** False while the invite is still waiting on the setup link being redeemed. */
  hasJoined: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CargoOption {
  key: Cargo;
  label: string;
  features: PlanFeature[];
  /** False when the plan is missing at least one module this cargo needs. */
  available: boolean;
  missingFeature?: PlanFeature;
}

export interface InviteTeamMemberPayload {
  name: string;
  email: string;
  cargo: Cargo;
}

export interface UpdateTeamMemberPayload {
  isActive?: boolean;
}
