export type WorkOrderStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'INVOICED'
  | 'CANCELLED';

export type WorkOrderItemType = 'SERVICE' | 'PRODUCT';

export interface WorkOrderCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface WorkOrderVehicle {
  id: string;
  licensePlate: string;
  brandName: string | null;
  modelName: string | null;
  year: number | null;
  color: string | null;
  currentKm: number;
}

export interface WorkOrderTechnician {
  id: string;
  name: string;
}

export interface WorkOrderItem {
  id: string;
  workOrderId: string;
  type: WorkOrderItemType;
  serviceId: string | null;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: string;
  tenantId: string;
  orderNo: string;
  status: WorkOrderStatus;
  customerId: string;
  vehicleId: string;
  technicianId: string | null;
  currentKm: number | null;
  notes: string | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  completedAt: string | null;
  invoicedAt: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  customer: WorkOrderCustomer;
  vehicle: WorkOrderVehicle;
  technician: WorkOrderTechnician | null;
  items: WorkOrderItem[];
}

export interface WorkOrderListItem {
  id: string;
  orderNo: string;
  status: WorkOrderStatus;
  customerId: string;
  vehicleId: string;
  technicianId: string | null;
  totalAmount: number;
  createdAt: string;
  customer: WorkOrderCustomer;
  vehicle: WorkOrderVehicle;
  technician: WorkOrderTechnician | null;
}

export interface WorkOrderListParams {
  status?: WorkOrderStatus | '';
  customerId?: string;
  vehicleId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateWorkOrderPayload {
  customerId: string;
  vehicleId: string;
  technicianId?: string;
  currentKm?: number;
  notes?: string;
  items?: CreateWorkOrderItemPayload[];
}

export interface CreateWorkOrderItemPayload {
  type: WorkOrderItemType;
  serviceId?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface UpdateWorkOrderStatusPayload {
  status: WorkOrderStatus;
  notes?: string;
}

export interface LookupVehicleResult {
  vehicle: WorkOrderVehicle & { id: string };
  customer: WorkOrderCustomer;
  lastServices: Array<{
    id: string;
    orderNo: string;
    status: WorkOrderStatus;
    createdAt: string;
    totalAmount: number | null;
  }>;
}

export interface PlateSearchVehicle {
  id: string;
  licensePlate: string;
  brandName: string | null;
  modelName: string | null;
  year: number | null;
  currentKm: number;
  currentOwner: WorkOrderCustomer | null;
}

export const STATUS_LABEL: Record<WorkOrderStatus, string> = {
  DRAFT: 'Taslak',
  IN_PROGRESS: 'Devam Ediyor',
  COMPLETED: 'Tamamlandı',
  INVOICED: 'Faturalandı',
  CANCELLED: 'İptal',
};

export const STATUS_BADGE_CLASS: Record<WorkOrderStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  INVOICED: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export const VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  DRAFT: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['INVOICED'],
  INVOICED: [],
  CANCELLED: [],
};
