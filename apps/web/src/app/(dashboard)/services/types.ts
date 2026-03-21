export interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  services?: Service[];
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  defaultPrice: number;
  estimatedDuration: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: ServiceCategory;
  serviceProducts?: ServiceProduct[];
}

export interface ServiceProduct {
  id: string;
  serviceId: string;
  productId: string;
  defaultQuantity: number;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    sku: string | null;
    unit: string;
    salePrice: number;
  };
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  sortOrder?: number;
}

export interface CreateServicePayload {
  categoryId: string;
  name: string;
  description?: string;
  defaultPrice: number;
  estimatedDuration?: number;
  isActive?: boolean;
}

export interface UpdateServicePayload {
  categoryId?: string;
  name?: string;
  description?: string;
  defaultPrice?: number;
  estimatedDuration?: number;
  isActive?: boolean;
}

export interface AddServiceProductPayload {
  productId: string;
  defaultQuantity: number;
}

export interface UpdateServiceProductPayload {
  defaultQuantity: number;
}
