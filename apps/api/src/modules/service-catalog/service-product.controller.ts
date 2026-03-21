import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/tenant.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermissions } from '../rbac/rbac.decorator';
import { ServiceProductService } from './service-product.service';
import { AddServiceProductDto } from './dto/add-service-product.dto';
import { UpdateServiceProductDto } from './dto/update-service-product.dto';

@ApiBearerAuth()
@ApiTags('Service Products')
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('services/:serviceId/products')
export class ServiceProductController {
  constructor(private readonly serviceProductService: ServiceProductService) {}

  @Get()
  @RequirePermissions('work_order:read', 'settings:manage')
  @ApiOperation({ summary: 'List all products linked to a service definition' })
  @ApiParam({ name: 'serviceId', description: 'Service definition UUID' })
  async getProducts(@Param('serviceId') serviceId: string) {
    const products = await this.serviceProductService.getProductsForService(serviceId);
    return { data: products };
  }

  @Post()
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Link a product to a service definition' })
  @ApiParam({ name: 'serviceId', description: 'Service definition UUID' })
  async addProduct(
    @Param('serviceId') serviceId: string,
    @Body() dto: AddServiceProductDto,
  ) {
    const link = await this.serviceProductService.addProduct(serviceId, dto);
    return { data: link };
  }

  @Patch(':productId')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Update the default quantity of a linked product' })
  @ApiParam({ name: 'serviceId', description: 'Service definition UUID' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  async updateQuantity(
    @Param('serviceId') serviceId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateServiceProductDto,
  ) {
    const link = await this.serviceProductService.updateQuantity(serviceId, productId, dto);
    return { data: link };
  }

  @Delete(':productId')
  @RequirePermissions('settings:manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a product link from a service definition' })
  @ApiParam({ name: 'serviceId', description: 'Service definition UUID' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  async removeProduct(
    @Param('serviceId') serviceId: string,
    @Param('productId') productId: string,
  ) {
    await this.serviceProductService.removeProduct(serviceId, productId);
  }
}
