import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ChangeStatusDto {
  @ApiProperty({
    enum: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    description: 'Target status. INVOICED transitions only occur via invoice creation.',
    example: 'IN_PROGRESS',
  })
  @IsEnum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  status!: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

  @ApiPropertyOptional({
    description: 'Optional notes recorded alongside the status change',
    example: 'All repairs finished, customer notified.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
