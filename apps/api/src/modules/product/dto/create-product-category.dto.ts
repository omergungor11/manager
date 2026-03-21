import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProductCategoryDto {
  @ApiProperty({ example: 'Yağlar' })
  @IsNotEmpty()
  @IsString()
  name!: string;
}
