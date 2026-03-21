import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export type ReminderChannel = 'sms' | 'email' | 'whatsapp';

export class CreateReminderRuleDto {
  @ApiProperty({
    description: 'UUID of the service definition this rule applies to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  serviceDefinitionId!: string;

  @ApiProperty({
    description: 'Name for this reminder rule',
    example: 'Oil Change Follow-up',
  })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({
    description: 'Send reminder this many days after the service is completed',
    example: 90,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  daysAfter!: number;

  @ApiProperty({
    description: 'Delivery channel for this reminder',
    enum: ['sms', 'email', 'whatsapp'],
    example: 'sms',
  })
  @IsEnum(['sms', 'email', 'whatsapp'])
  channel!: ReminderChannel;

  @ApiProperty({
    description:
      'Message template body. Supported variables: {{customerName}}, {{vehiclePlate}}, {{serviceName}}',
    example:
      'Hello {{customerName}}, your {{vehiclePlate}} is due for a {{serviceName}} check-up. Please call us to book.',
  })
  @IsString()
  @MinLength(1)
  messageTemplate!: string;

  @ApiPropertyOptional({
    description: 'Whether this rule is active and will trigger reminders',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
