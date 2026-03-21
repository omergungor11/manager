export interface VehicleBrand {
  id: string;
  name: string;
}

export interface VehicleModel {
  id: string;
  name: string;
  brandId: string;
}

export interface VehicleCustomer {
  id: string;
  name: string;
  phone?: string | null;
}

export interface VehicleOwnership {
  id: string;
  startDate: string;
  endDate?: string | null;
  customer: VehicleCustomer;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  brandId?: string | null;
  modelId?: string | null;
  brandName?: string | null;
  modelName?: string | null;
  year?: number | null;
  color?: string | null;
  vin?: string | null;
  currentKm: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  currentOwner?: VehicleCustomer | null;
  ownerships?: VehicleOwnership[];
}

export interface ServiceHistoryItem {
  id: string;
  orderNo: string;
  status: string;
  createdAt: string;
  completedAt?: string | null;
  currentKm?: number | null;
  totalAmount?: number | null;
  description?: string | null;
}

export interface ServiceHistoryMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  lastServiceDate?: string | null;
  lastServiceKm?: number | null;
}

export interface VehicleFormData {
  licensePlate: string;
  brandId: string;
  modelId: string;
  brandName: string;
  modelName: string;
  year: string;
  color: string;
  vin: string;
  currentKm: string;
  notes: string;
}
