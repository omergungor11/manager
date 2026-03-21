export interface ProductCategory {
  id: string;
  name: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string | null;
  category: ProductCategory | null;
  sku: string | null;
  name: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PriceHistory {
  id: string;
  productId: string;
  costPrice: number;
  salePrice: number;
  changedAt: string;
  changedBy: string | null;
}

export interface ProductMargin {
  costPrice: number;
  salePrice: number;
  marginAmount: number;
  marginPercent: number;
}

export interface StockEntry {
  id: string;
  tenantId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitCost: number;
  supplierId: string | null;
  invoiceNo: string | null;
  date: string;
  notes: string | null;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  product?: Product;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  reason: string | null;
  date: string;
  createdAt: string;
}

export interface CreateProductDto {
  name: string;
  sku?: string;
  categoryId?: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  isActive: boolean;
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface CreateStockEntryDto {
  productId: string;
  quantity: number;
  unitCost: number;
  invoiceNo?: string;
  notes?: string;
  date?: string;
}

export interface CreateCategoryDto {
  name: string;
}
