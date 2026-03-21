import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsJSON,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export type NotificationChannel = 'sms' | 'email' | 'whatsapp' | 'push';
export type NotificationType = 'reminder' | 'invoice' | 'payment' | 'general';

export class CreateNotificationDto {
  @ApiPropertyOptional({
    description: 'UUID of the recipient user or customer',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  recipientId?: string;

  @ApiPropertyOptional({
    description: 'Recipient phone number (required for sms/whatsapp channels)',
    example: '+905551234567',
  })
  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @ApiPropertyOptional({
    description: 'Recipient email address (required for email channel)',
    example: 'customer@example.com',
  })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiProperty({
    description: 'Delivery channel',
    enum: ['sms', 'email', 'whatsapp', 'push'],
    example: 'sms',
  })
  @IsEnum(['sms', 'email', 'whatsapp', 'push'])
  channel!: NotificationChannel;

  @ApiProperty({
    description: 'Notification type',
    enum: ['reminder', 'invoice', 'payment', 'general'],
    example: 'reminder',
  })
  @IsEnum(['reminder', 'invoice', 'payment', 'general'])
  type!: NotificationType;

  @ApiProperty({
    description: 'Notification title / subject',
    example: 'Service Reminder',
  })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({
    description: 'Full notification message body',
    example: 'Your vehicle is due for an oil change. Please contact us to schedule.',
  })
  @IsString()
  @MinLength(1)
  message!: string;

  @ApiPropertyOptional({
    description: 'Arbitrary JSON metadata (e.g. workOrderId, reminderId)',
    example: '{"workOrderId":"uuid","reminderId":"uuid"}',
  })
  @IsOptional()
  @IsJSON()
  metadata?: string;
}
