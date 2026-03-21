export { ReportingModule } from './reporting.module';
export { ReportingService } from './reporting.service';
export { ReportingController } from './reporting.controller';
export { ReportQueryDto, REPORT_FORMATS } from './dto/report-query.dto';
export type { ReportFormat } from './dto/report-query.dto';
export type {
  DateRange,
  CategoryBreakdown,
  IncomeExpenseReport,
  ProfitLossReport,
  LowStockItem,
  TopProduct,
  StockReport,
  TopCustomer,
  CustomerReport,
  MostServicedVehicle,
  VehicleReport,
} from './reporting.service';
