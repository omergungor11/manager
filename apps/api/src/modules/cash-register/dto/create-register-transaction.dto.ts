import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export type TransactionType = 'IN' | 'OUT' | 'TRANSFER';

export const TRANSACTION_TYPES: TransactionType[] = ['IN', 'OUT', 'TRANSFER'];

export class CreateRegisterTransactionDto {
  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Source cash register UUID',
  })
  @IsNotEmpty()
  @IsUUID()
  cashRegisterId!: string;

  @ApiProperty({
    enum: TRANSACTION_TYPES,
    example: 'IN',
    description: 'Transaction direction: IN (money received), OUT (money paid), TRANSFER (between registers)',
  })
  @IsNotEmpty()
  @IsEnum(TRANSACTION_TYPES)
  type!: TransactionType;

  @ApiProperty({ example: 500.0, description: 'Transaction amount (must be positive)' })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: 'Nakit tahsilat', description: 'Transaction description' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({
    example: 'payment',
    description: 'Reference entity type (e.g. payment, expense, transfer)',
  })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Reference entity ID',
  })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'Target register UUID — required when type is TRANSFER',
  })
  @IsOptional()
  @IsUUID()
  targetRegisterId?: string;
}
