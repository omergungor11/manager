import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ---------------------------------------------------------------------------
// Internal result types
// ---------------------------------------------------------------------------

export interface DateRange {
  dateFrom: Date;
  dateTo: Date;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
}

export interface IncomeExpenseReport {
  dateFrom: Date;
  dateTo: Date;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  incomeByCategory: CategoryBreakdown[];
  expenseByCategory: CategoryBreakdown[];
}

export interface ProfitLossReport {
  dateFrom: Date;
  dateTo: Date;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  operatingExpenses: number;
  netProfit: number;
  netMarginPct: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  sku: string | null;
  currentStock: number;
  minStock: number;
  unit: string;
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string | null;
  outCount: number;
  totalQuantityOut: number;
}

export interface StockReport {
  totalStockValue: number;
  lowStockItems: LowStockItem[];
  mostSoldProducts: TopProduct[];
  inventoryTurnover: number | null;
}

export interface TopCustomer {
  id: string;
  name: string;
  type: string;
  totalRevenue: number;
  invoiceCount: number;
}

export interface CustomerReport {
  dateFrom: Date;
  dateTo: Date;
  totalCustomers: number;
  newCustomers: number;
  byType: { type: string; count: number }[];
  topByRevenue: TopCustomer[];
}

export interface MostServicedVehicle {
  vehicleId: string;
  licensePlate: string;
  brandName: string | null;
  modelName: string | null;
  workOrderCount: number;
}

export interface VehicleReport {
  dateFrom: Date;
  dateTo: Date;
  totalVehiclesServiced: number;
  byBrand: { brand: string; count: number }[];
  mostServiced: MostServicedVehicle[];
  averageServiceFrequencyDays: number | null;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------------------
  // TASK-065: Infrastructure — date range normalization
  // -------------------------------------------------------------------------

  getDateRange(dateFrom?: Date, dateTo?: Date): DateRange {
    const now = new Date();

    const resolvedFrom =
      dateFrom ?? new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const resolvedTo =
      dateTo ??
      new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return { dateFrom: resolvedFrom, dateTo: resolvedTo };
  }

  // -------------------------------------------------------------------------
  // TASK-066: Income / Expense report
  // -------------------------------------------------------------------------

  async getIncomeExpenseReport(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<IncomeExpenseReport> {
    const { dateFrom: from, dateTo: to } = this.getDateRange(dateFrom, dateTo);

    const dateFilter = { gte: from, lte: to };

    const [incomeRows, expenseRows] = await Promise.all([
      this.prisma.income.groupBy({
        by: ['category'],
        where: { tenantId, date: dateFilter },
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      this.prisma.expense.groupBy({
        by: ['category'],
        where: { tenantId, date: dateFilter },
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

    const totalIncome = incomeRows.reduce(
      (acc, row) => acc + Number(row._sum.amount ?? 0),
      0,
    );
    const totalExpense = expenseRows.reduce(
      (acc, row) => acc + Number(row._sum.amount ?? 0),
      0,
    );

    const incomeByCategory: CategoryBreakdown[] = incomeRows.map((row) => ({
      category: row.category,
      total: Number(row._sum.amount ?? 0),
      count: row._count.id,
    }));

    const expenseByCategory: CategoryBreakdown[] = expenseRows.map((row) => ({
      category: row.category,
      total: Number(row._sum.amount ?? 0),
      count: row._count.id,
    }));

    return {
      dateFrom: from,
      dateTo: to,
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      incomeByCategory,
      expenseByCategory,
    };
  }

  // -------------------------------------------------------------------------
  // TASK-067: Profit / Loss report
  // -------------------------------------------------------------------------

  async getProfitLossReport(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<ProfitLossReport> {
    const { dateFrom: from, dateTo: to } = this.getDateRange(dateFrom, dateTo);

    const dateFilter = { gte: from, lte: to };

    // Revenue — sum of total on paid invoices in the period
    const revenueAgg = await this.prisma.invoice.aggregate({
      where: {
        tenantId,
        date: dateFilter,
        status: { in: ['PAID', 'PARTIALLY_PAID'] },
      },
      _sum: { total: true },
    });
    const revenue = Number(revenueAgg._sum.total ?? 0);

    // COGS — cost price of products consumed in completed work orders in the period.
    // We sum (workOrderItem.quantity * product.costPrice) for product-type items
    // whose work order was completed within the date range.
    const productItems = await this.prisma.workOrderItem.findMany({
      where: {
        type: 'product',
        productId: { not: null },
        workOrder: {
          tenantId,
          status: { in: ['COMPLETED', 'INVOICED'] },
          completedAt: dateFilter,
        },
      },
      select: {
        quantity: true,
        product: { select: { costPrice: true } },
      },
    });

    const cogs = productItems.reduce((acc, item) => {
      const qty = Number(item.quantity);
      const cost = Number(item.product?.costPrice ?? 0);
      return acc + qty * cost;
    }, 0);

    const grossProfit = revenue - cogs;
    const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Operating expenses — all Expense records in the period
    const expenseAgg = await this.prisma.expense.aggregate({
      where: { tenantId, date: dateFilter },
      _sum: { amount: true },
    });
    const operatingExpenses = Number(expenseAgg._sum.amount ?? 0);

    const netProfit = grossProfit - operatingExpenses;
    const netMarginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      dateFrom: from,
      dateTo: to,
      revenue,
      cogs: Math.round(cogs * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossMarginPct: Math.round(grossMarginPct * 100) / 100,
      operatingExpenses,
      netProfit: Math.round(netProfit * 100) / 100,
      netMarginPct: Math.round(netMarginPct * 100) / 100,
    };
  }

  // -------------------------------------------------------------------------
  // TASK-068: Stock report
  // -------------------------------------------------------------------------

  async getStockReport(tenantId: string): Promise<StockReport> {
    // All active products for this tenant
    const products = await this.prisma.product.findMany({
      where: { tenantId, deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        unit: true,
        currentStock: true,
        minStock: true,
        costPrice: true,
      },
    });

    // Total stock value
    const totalStockValue = products.reduce(
      (acc, p) => acc + Number(p.currentStock) * Number(p.costPrice),
      0,
    );

    // Low stock — currentStock < minStock
    const lowStockItems: LowStockItem[] = products
      .filter((p) => Number(p.currentStock) < Number(p.minStock))
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStock: Number(p.currentStock),
        minStock: Number(p.minStock),
        unit: p.unit,
      }));

    // Most sold — aggregate OUT movements by product
    const outMovements = await this.prisma.stockMovement.groupBy({
      by: ['productId'],
      where: { tenantId, type: 'OUT' },
      _count: { id: true },
      _sum: { quantity: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Build a lookup map for product metadata
    const productMap = new Map(products.map((p) => [p.id, p]));

    const mostSoldProducts: TopProduct[] = outMovements
      .map((row) => {
        const product = productMap.get(row.productId);
        return {
          id: row.productId,
          name: product?.name ?? 'Unknown',
          sku: product?.sku ?? null,
          outCount: row._count.id,
          totalQuantityOut: Number(row._sum.quantity ?? 0),
        };
      })
      .filter((p) => p.name !== 'Unknown');

    // Inventory turnover: total OUT quantity / average stock value
    // Simplified: total COGS from OUT movements / current stock value
    const totalOut = await this.prisma.stockMovement.aggregate({
      where: { tenantId, type: 'OUT' },
      _sum: { quantity: true },
    });
    const turnover =
      totalStockValue > 0
        ? Number(totalOut._sum.quantity ?? 0) / totalStockValue
        : null;

    return {
      totalStockValue: Math.round(totalStockValue * 100) / 100,
      lowStockItems,
      mostSoldProducts,
      inventoryTurnover: turnover !== null ? Math.round(turnover * 100) / 100 : null,
    };
  }

  // -------------------------------------------------------------------------
  // TASK-069: Customer & Vehicle reports
  // -------------------------------------------------------------------------

  async getCustomerReport(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<CustomerReport> {
    const { dateFrom: from, dateTo: to } = this.getDateRange(dateFrom, dateTo);

    const dateFilter = { gte: from, lte: to };

    // Total customer count (all time, not deleted)
    const totalCustomers = await this.prisma.customer.count({
      where: { tenantId, deletedAt: null },
    });

    // New customers in period
    const newCustomers = await this.prisma.customer.count({
      where: { tenantId, deletedAt: null, createdAt: dateFilter },
    });

    // Customer count by type
    const byTypeRows = await this.prisma.customer.groupBy({
      by: ['type'],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
    });
    const byType = byTypeRows.map((row) => ({
      type: row.type,
      count: row._count.id,
    }));

    // Top customers by revenue — sum Invoice.total for paid invoices in period
    const invoicesByCustomer = await this.prisma.invoice.groupBy({
      by: ['customerId'],
      where: {
        tenantId,
        date: dateFilter,
        status: { in: ['PAID', 'PARTIALLY_PAID'] },
      },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10,
    });

    const customerIds = invoicesByCustomer.map((row) => row.customerId);
    const customerDetails = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, type: true },
    });
    const customerMap = new Map(customerDetails.map((c) => [c.id, c]));

    const topByRevenue: TopCustomer[] = invoicesByCustomer.map((row) => {
      const c = customerMap.get(row.customerId);
      return {
        id: row.customerId,
        name: c?.name ?? 'Unknown',
        type: c?.type ?? 'unknown',
        totalRevenue: Number(row._sum.total ?? 0),
        invoiceCount: row._count.id,
      };
    });

    return {
      dateFrom: from,
      dateTo: to,
      totalCustomers,
      newCustomers,
      byType,
      topByRevenue,
    };
  }

  async getVehicleReport(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<VehicleReport> {
    const { dateFrom: from, dateTo: to } = this.getDateRange(dateFrom, dateTo);

    const dateFilter = { gte: from, lte: to };

    // Work orders completed in the period (used for most-serviced and by-brand)
    const workOrdersByVehicle = await this.prisma.workOrder.groupBy({
      by: ['vehicleId'],
      where: {
        tenantId,
        status: { in: ['COMPLETED', 'INVOICED'] },
        completedAt: dateFilter,
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const totalVehiclesServiced = await this.prisma.workOrder.groupBy({
      by: ['vehicleId'],
      where: {
        tenantId,
        status: { in: ['COMPLETED', 'INVOICED'] },
        completedAt: dateFilter,
      },
    });

    const vehicleIds = workOrdersByVehicle.map((r) => r.vehicleId);
    const vehicles = await this.prisma.vehicle.findMany({
      where: { id: { in: vehicleIds }, deletedAt: null },
      select: {
        id: true,
        licensePlate: true,
        brandName: true,
        modelName: true,
      },
    });
    const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));

    const mostServiced: MostServicedVehicle[] = workOrdersByVehicle.map(
      (row) => {
        const v = vehicleMap.get(row.vehicleId);
        return {
          vehicleId: row.vehicleId,
          licensePlate: v?.licensePlate ?? 'Unknown',
          brandName: v?.brandName ?? null,
          modelName: v?.modelName ?? null,
          workOrderCount: row._count.id,
        };
      },
    );

    // Vehicles by brand — from all vehicles that have work orders in period
    const allServicedVehicleIds = totalVehiclesServiced.map((r) => r.vehicleId);
    const allServicedVehicles = await this.prisma.vehicle.findMany({
      where: { id: { in: allServicedVehicleIds }, deletedAt: null },
      select: { brandName: true },
    });

    const brandCountMap = new Map<string, number>();
    for (const v of allServicedVehicles) {
      const brand = v.brandName ?? 'Unknown';
      brandCountMap.set(brand, (brandCountMap.get(brand) ?? 0) + 1);
    }
    const byBrand = Array.from(brandCountMap.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count);

    // Average service frequency in days — median days between work orders per vehicle
    // Simplified: (period length in days) / (total work orders in period) if > 0
    let averageServiceFrequencyDays: number | null = null;
    const totalWorkOrders = totalVehiclesServiced.length;
    if (totalWorkOrders > 0) {
      const periodDays =
        (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
      averageServiceFrequencyDays =
        Math.round((periodDays / totalWorkOrders) * 10) / 10;
    }

    return {
      dateFrom: from,
      dateTo: to,
      totalVehiclesServiced: totalVehiclesServiced.length,
      byBrand,
      mostServiced,
      averageServiceFrequencyDays,
    };
  }
}
