export interface Client {
  id: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateClientPayload = Pick<Client, 'name'> &
  Partial<Pick<Client, 'document' | 'email' | 'phone' | 'address' | 'city' | 'state' | 'zipCode' | 'notes'>>;

export type UpdateClientPayload = Partial<CreateClientPayload>;
