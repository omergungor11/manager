import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController, ProductCategoryController } from './product.controller';

@Module({
  controllers: [ProductCategoryController, ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
