export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'ACCOUNT';

export interface InvoiceCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface InvoiceWorkOrder {
  id: string;
  orderNumber: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  notes: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  customer: InvoiceCustomer | null;
  workOrder: InvoiceWorkOrder | null;
  items: InvoiceItem[];
  payments: InvoicePayment[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  customer: InvoiceCustomer | null;
}

export interface InvoiceListParams {
  status?: InvoiceStatus | '';
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaymentFormValues {
  amount: string;
  method: PaymentMethod;
  date: string;
  notes: string;
}

export interface CreateInvoiceBody {
  workOrderId: string;
  accountId?: string;
  dueDate?: string;
}

export interface CreatePaymentBody {
  amount: number;
  method: PaymentMethod;
  date: string;
  notes?: string;
}
