import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VehicleBrandService } from './vehicle-brand.service';

@ApiTags('Vehicle Brands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicle-brands')
export class VehicleBrandController {
  constructor(private readonly vehicleBrandService: VehicleBrandService) {}

  @Get()
  @ApiOperation({ summary: 'List all vehicle brands, optionally filtered by search query' })
  @ApiQuery({ name: 'search', required: false, description: 'Filter brands by name (case-insensitive)' })
  async findAll(@Query('search') search?: string) {
    const brands = search
      ? await this.vehicleBrandService.searchBrands(search)
      : await this.vehicleBrandService.findAllBrands();

    return { data: brands };
  }

  @Get(':id/models')
  @ApiOperation({ summary: 'List all models for a vehicle brand' })
  async findModelsByBrand(@Param('id') id: string) {
    const models = await this.vehicleBrandService.findModelsByBrand(id);
    return { data: models };
  }
}
