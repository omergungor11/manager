export type EmployeeStatus = 'active' | 'inactive' | 'terminated';

export interface Employee {
  id: string;
  tenantId: string;
  name: string;
  phone: string | null;
  email: string | null;
  tcNo: string | null;
  position: string | null;
  department: string | null;
  startDate: string;
  terminationDate: string | null;
  grossSalary: number;
  status: EmployeeStatus;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFormValues {
  name: string;
  phone: string;
  email: string;
  tcNo: string;
  position: string;
  department: string;
  startDate: string;
  grossSalary: number;
}

export interface EmployeeListParams {
  search?: string;
  status?: EmployeeStatus | '';
  page?: number;
  limit?: number;
}
