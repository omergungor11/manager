import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryNotificationDto {
  @ApiPropertyOptional({
    description: 'Filter by delivery channel',
    enum: ['sms', 'email', 'whatsapp', 'push'],
    example: 'sms',
  })
  @IsOptional()
  @IsEnum(['sms', 'email', 'whatsapp', 'push'])
  channel?: 'sms' | 'email' | 'whatsapp' | 'push';

  @ApiPropertyOptional({
    description: 'Filter by notification type',
    enum: ['reminder', 'invoice', 'payment', 'general'],
    example: 'reminder',
  })
  @IsOptional()
  @IsEnum(['reminder', 'invoice', 'payment', 'general'])
  type?: 'reminder' | 'invoice' | 'payment' | 'general';

  @ApiPropertyOptional({
    description: 'Filter by delivery status',
    enum: ['PENDING', 'SENT', 'FAILED'],
    example: 'PENDING',
  })
  @IsOptional()
  @IsEnum(['PENDING', 'SENT', 'FAILED'])
  status?: 'PENDING' | 'SENT' | 'FAILED';

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
