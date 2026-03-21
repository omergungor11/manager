export type CustomerType = 'individual' | 'company';

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  type: CustomerType;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxId: string | null;
  notes: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CustomerFormValues {
  name: string;
  type: CustomerType;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  notes: string;
}

export interface CustomerListParams {
  search?: string;
  type?: CustomerType | '';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
