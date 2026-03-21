import { Module } from '@nestjs/common';
import { ServiceCatalogService } from './service-catalog.service';
import { ServiceCatalogController } from './service-catalog.controller';
import { ServiceProductService } from './service-product.service';
import { ServiceProductController } from './service-product.controller';

@Module({
  controllers: [ServiceCatalogController, ServiceProductController],
  providers: [ServiceCatalogService, ServiceProductService],
  exports: [ServiceCatalogService, ServiceProductService],
})
export class ServiceCatalogModule {}
