import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'supervisor' })
  @IsString()
  name!: string;

  @ApiProperty({
    example: ['customer:read', 'customer:create', 'vehicle:read'],
    description: 'Array of permission strings in resource:action format',
  })
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];
}
