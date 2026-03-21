import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateServiceProductDto {
  @ApiProperty({ example: 2.5, description: 'Updated default quantity of the product consumed per service (min 0.001)' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  defaultQuantity!: number;
}
