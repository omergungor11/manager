import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';

export type ReportFormat = 'json' | 'csv';

export const REPORT_FORMATS: ReportFormat[] = ['json', 'csv'];

export class ReportQueryDto {
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-01-01T00:00:00.000Z',
    description: 'Start of the reporting period (inclusive)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-12-31T23:59:59.999Z',
    description: 'End of the reporting period (inclusive)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;

  @ApiPropertyOptional({
    enum: REPORT_FORMATS,
    default: 'json',
    description: 'Response format — json or csv',
  })
  @IsOptional()
  @IsEnum(REPORT_FORMATS)
  format?: ReportFormat = 'json';
}
