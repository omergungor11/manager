import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'account';

export class CreatePaymentDto {
  @ApiProperty({ description: 'UUID of the invoice to pay', example: 'uuid-of-invoice' })
  @IsUUID()
  invoiceId!: string;

  @ApiProperty({ description: 'Payment amount', example: 500.00, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({
    description: 'Payment method',
    enum: ['cash', 'card', 'transfer', 'account'],
    example: 'cash',
  })
  @IsEnum(['cash', 'card', 'transfer', 'account'])
  method!: PaymentMethod;

  @ApiPropertyOptional({ description: 'Date of payment (defaults to now)', example: '2026-03-21T10:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @ApiPropertyOptional({ description: 'Optional notes for this payment', example: 'Paid via bank transfer ref #123' })
  @IsOptional()
  @IsString()
  notes?: string;
}
