import type { AccountType } from '@manager/shared';

export type { AccountType };

export interface Account {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: AccountType;
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

export interface AccountBalance {
  balance: number;
}

export type TransactionType = 'DEBIT' | 'CREDIT';

export interface AccountTransaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string;
  runningBalance: number;
  createdAt: string;
}

export interface AccountFormValues {
  name: string;
  type: AccountType;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  notes: string;
}

export interface TransactionFormValues {
  type: TransactionType;
  amount: string;
  description: string;
  date: string;
}

export interface AccountListParams {
  search?: string;
  type?: AccountType | '';
  page?: number;
  limit?: number;
}
