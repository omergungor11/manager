export const ALL_PERMISSIONS = [
  // Customer
  'customer:create',
  'customer:read',
  'customer:update',
  'customer:delete',

  // Vehicle
  'vehicle:create',
  'vehicle:read',
  'vehicle:update',
  'vehicle:delete',

  // Work Order
  'work_order:create',
  'work_order:read',
  'work_order:update',
  'work_order:delete',

  // Invoice
  'invoice:create',
  'invoice:read',
  'invoice:update',
  'invoice:delete',

  // Payment
  'payment:create',
  'payment:read',
  'payment:update',
  'payment:delete',

  // Stock
  'stock:create',
  'stock:read',
  'stock:update',
  'stock:delete',

  // Employee
  'employee:create',
  'employee:read',
  'employee:update',
  'employee:delete',

  // Payroll
  'payroll:create',
  'payroll:read',
  'payroll:update',
  'payroll:delete',

  // Account
  'account:create',
  'account:read',
  'account:update',
  'account:delete',

  // Report
  'report:read',

  // Settings
  'settings:manage',

  // User
  'user:create',
  'user:read',
  'user:update',
  'user:delete',

  // Role
  'role:create',
  'role:read',
  'role:update',
  'role:delete',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number] | '*';

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],

  manager: [
    'customer:create',
    'customer:read',
    'customer:update',
    'customer:delete',
    'vehicle:create',
    'vehicle:read',
    'vehicle:update',
    'vehicle:delete',
    'work_order:create',
    'work_order:read',
    'work_order:update',
    'work_order:delete',
    'invoice:create',
    'invoice:read',
    'invoice:update',
    'invoice:delete',
    'payment:create',
    'payment:read',
    'payment:update',
    'payment:delete',
    'stock:create',
    'stock:read',
    'stock:update',
    'stock:delete',
    'employee:create',
    'employee:read',
    'employee:update',
    'employee:delete',
    'payroll:create',
    'payroll:read',
    'payroll:update',
    'payroll:delete',
    'account:create',
    'account:read',
    'account:update',
    'account:delete',
    'report:read',
  ],

  technician: [
    'work_order:read',
    'work_order:update',
    'customer:read',
    'vehicle:read',
    'stock:read',
  ],

  cashier: [
    'invoice:create',
    'invoice:read',
    'invoice:update',
    'invoice:delete',
    'payment:create',
    'payment:read',
    'payment:update',
    'payment:delete',
    'customer:read',
    'vehicle:read',
    'work_order:read',
    'account:read',
    'report:read',
  ],
};
