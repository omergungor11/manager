// Response types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  error: {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
  };
}

// Tenant
export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  schema: string;
}

// Enums as const objects
export const WORK_ORDER_STATUS = {
  DRAFT: 'DRAFT',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  INVOICED: 'INVOICED',
  CANCELLED: 'CANCELLED',
} as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUS)[keyof typeof WORK_ORDER_STATUS];

export const INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;
export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

export const PAYMENT_METHOD = {
  CASH: 'CASH',
  CARD: 'CARD',
  TRANSFER: 'TRANSFER',
  ACCOUNT: 'ACCOUNT',
} as const;
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const STOCK_MOVEMENT_TYPE = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUST: 'ADJUST',
} as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPE)[keyof typeof STOCK_MOVEMENT_TYPE];

export const ACCOUNT_TYPE = {
  CUSTOMER: 'CUSTOMER',
  SUPPLIER: 'SUPPLIER',
  OTHER: 'OTHER',
} as const;
export type AccountType = (typeof ACCOUNT_TYPE)[keyof typeof ACCOUNT_TYPE];

export const USER_ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  TECHNICIAN: 'TECHNICIAN',
  CASHIER: 'CASHIER',
} as const;
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
