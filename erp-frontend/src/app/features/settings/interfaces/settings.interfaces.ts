export interface CompanySettings {
  id: string;
  name: string;
  document: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  logoUrl?: string | null;
  businessHoursStart?: string | null;
  businessHoursEnd?: string | null;
  workDays: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UpdateCompanySettingsPayload = Partial<
  Pick<
    CompanySettings,
    | 'name'
    | 'document'
    | 'email'
    | 'phone'
    | 'address'
    | 'city'
    | 'state'
    | 'zipCode'
    | 'businessHoursStart'
    | 'businessHoursEnd'
    | 'workDays'
  >
>;

export interface UserProfile {
  id: string;
  companyId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  isActive: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export type UpdateProfilePayload = Partial<Pick<UserProfile, 'name'>>;
