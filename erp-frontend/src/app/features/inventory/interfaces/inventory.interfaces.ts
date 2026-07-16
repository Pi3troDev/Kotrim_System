export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';
export type CategoryType = 'INVENTORY' | 'EXPENSE' | 'INCOME';

export interface CategorySummary {
  id: string;
  name: string;
}

export interface SupplierSummary {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  sku?: string | null;
  name: string;
  description?: string | null;
  unit: string;
  costPrice: number;
  salePrice: number;
  quantityInStock: number;
  minimumStock: number;
  location?: string | null;
  categoryId?: string | null;
  supplierId?: string | null;
  category?: CategorySummary | null;
  supplier?: SupplierSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  userId?: string | null;
  type: StockMovementType;
  quantity: number;
  reason?: string | null;
  referenceId?: string | null;
  createdAt: string;
}

export type CreateCategoryPayload = Pick<Category, 'name' | 'type'>;
export type UpdateCategoryPayload = Partial<Pick<Category, 'name'>>;

export type CreateSupplierPayload = Pick<Supplier, 'name'> &
  Partial<Pick<Supplier, 'document' | 'email' | 'phone' | 'address' | 'notes'>>;
export type UpdateSupplierPayload = Partial<CreateSupplierPayload>;

export type CreateInventoryItemPayload = Pick<InventoryItem, 'name'> &
  Partial<Pick<InventoryItem, 'sku' | 'description' | 'unit' | 'costPrice' | 'salePrice' | 'minimumStock' | 'location' | 'categoryId' | 'supplierId'>> & {
    initialQuantity?: number;
  };
export type UpdateInventoryItemPayload = Omit<Partial<CreateInventoryItemPayload>, 'initialQuantity'>;

export interface CreateStockMovementPayload {
  type: StockMovementType;
  quantity: number;
  reason?: string;
}
