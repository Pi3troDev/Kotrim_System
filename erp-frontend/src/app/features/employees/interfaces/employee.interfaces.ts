export interface Employee {
  id: string;
  name: string;
  document?: string | null;
  position?: string | null;
  specialty?: string | null;
  phone?: string | null;
  email?: string | null;
  hiredAt?: string | null;
  salary?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateEmployeePayload = Pick<Employee, 'name'> &
  Partial<Pick<Employee, 'document' | 'position' | 'specialty' | 'phone' | 'email' | 'hiredAt' | 'salary'>>;

export type UpdateEmployeePayload = Partial<CreateEmployeePayload> & Partial<Pick<Employee, 'isActive'>>;
