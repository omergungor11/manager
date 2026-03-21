import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Örnek Oto Servis' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'ornek-oto' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug yalnızca küçük harf, rakam ve tire içerebilir',
  })
  slug!: string;

  @ApiPropertyOptional({ enum: ['free', 'pro', 'enterprise'], default: 'free' })
  @IsOptional()
  @IsEnum(['free', 'pro', 'enterprise'])
  plan?: string = 'free';

  @ApiPropertyOptional({
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'suspended'])
  status?: string = 'active';
}
