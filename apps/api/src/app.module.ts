import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { RoleModule } from './modules/role/role.module';
import { UserModule } from './modules/user/user.module';
import { VehicleBrandModule } from './modules/vehicle-brand/vehicle-brand.module';
import { CustomerModule } from './modules/customer/customer.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { ServiceCatalogModule } from './modules/service-catalog/service-catalog.module';
import { ProductModule } from './modules/product/product.module';
import { CustomerVehicleModule } from './modules/customer-vehicle/customer-vehicle.module';
import { StockModule } from './modules/stock/stock.module';
import { LookupModule } from './modules/lookup/lookup.module';
import { WorkOrderModule } from './modules/work-order/work-order.module';
import { AccountModule } from './modules/account/account.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { EmployeeModule } from './modules/employee/employee.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    TenantModule,
    AuthModule,
    RbacModule,
    RoleModule,
    UserModule,
    VehicleBrandModule,
    CustomerModule,
    VehicleModule,
    CustomerVehicleModule,
    ServiceCatalogModule,
    ProductModule,
    StockModule,
    LookupModule,
    WorkOrderModule,
    AccountModule,
    InvoiceModule,
    ExpenseModule,
    EmployeeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
