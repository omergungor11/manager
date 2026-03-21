import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterTenantDto {
  @ApiProperty({ example: 'Acme Auto Service' })
  @IsString()
  tenantName: string;

  @ApiProperty({
    example: 'acme-auto',
    description: 'URL-friendly slug (lowercase, hyphens, numbers)',
  })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with hyphens (e.g. "my-shop")',
  })
  slug: string;

  @ApiProperty({ example: 'Admin User' })
  @IsString()
  adminName: string;

  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: 'securepass123' })
  @IsString()
  @MinLength(8)
  adminPassword: string;
}
