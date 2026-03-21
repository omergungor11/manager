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

export class CreateTransactionDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsNotEmpty()
  @IsUUID()
  accountId!: string;

  @ApiProperty({ enum: ['DEBIT', 'CREDIT'], example: 'DEBIT' })
  @IsNotEmpty()
  @IsEnum(['DEBIT', 'CREDIT'])
  type!: 'DEBIT' | 'CREDIT';

  @ApiProperty({ example: 1500.0 })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: 'Parça bedelinin tahsilatı' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({
    enum: ['invoice', 'payment', 'expense', 'manual'],
    example: 'invoice',
  })
  @IsOptional()
  @IsEnum(['invoice', 'payment', 'expense', 'manual'])
  referenceType?: 'invoice' | 'payment' | 'expense' | 'manual';

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({ example: '2026-03-21T10:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;
}
