import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '+905001234567' })
  @IsOptional()
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'banned'] })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'banned'])
  status!: string;
}
