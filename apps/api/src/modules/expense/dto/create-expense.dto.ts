import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export type ExpenseCategory =
  | 'rent'
  | 'utility'
  | 'supply'
  | 'personnel'
  | 'maintenance'
  | 'other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'rent',
  'utility',
  'supply',
  'personnel',
  'maintenance',
  'other',
];

export class CreateExpenseDto {
  @ApiProperty({
    enum: EXPENSE_CATEGORIES,
    example: 'rent',
    description: 'Expense category',
  })
  @IsNotEmpty()
  @IsEnum(EXPENSE_CATEGORIES)
  category!: ExpenseCategory;

  @ApiProperty({ example: 1500.0, description: 'Expense amount' })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @ApiProperty({ example: 'Aylık kira ödemesi', description: 'Expense description' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Supplier account reference (Account with type SUPPLIER)',
  })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Cari hesap ID — triggers an AccountTransaction (DEBIT) when provided',
  })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-03-21T00:00:00.000Z',
    description: 'Expense date (defaults to now)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @ApiPropertyOptional({ example: 'Kira kontratı — 2026' })
  @IsOptional()
  @IsString()
  notes?: string;
}
