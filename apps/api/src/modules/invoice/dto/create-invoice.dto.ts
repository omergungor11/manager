import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'UUID of the completed work order to invoice', example: 'uuid-of-work-order' })
  @IsUUID()
  workOrderId!: string;

  @ApiPropertyOptional({ description: 'UUID of the cari hesap (account) to associate with this invoice', example: 'uuid-of-account' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Payment due date', example: '2026-04-21T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Additional notes for the invoice', example: 'Payment within 30 days' })
  @IsOptional()
  @IsString()
  notes?: string;
}
