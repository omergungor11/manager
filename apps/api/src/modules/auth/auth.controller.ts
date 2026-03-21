import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { TenantContext } from '../tenant/tenant.decorator';
import { CurrentTenant } from '../tenant/tenant.decorator';
import { TenantGuard } from '../tenant/tenant.guard';
import type { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import type { LoginDto } from './dto/login.dto';
import type { RegisterTenantDto } from './dto/register-tenant.dto';
import type { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto, @CurrentTenant() tenant: TenantContext) {
    return this.authService.login(dto.email, dto.password, tenant.slug);
  }

  @Post('register')
  @UseGuards(TenantGuard, JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new user within a tenant' })
  async register(@Body() dto: RegisterDto, @CurrentTenant() tenant: TenantContext) {
    return this.authService.register(dto, tenant.slug);
  }

  @Post('register-tenant')
  @ApiOperation({ summary: 'Register a new tenant (public endpoint)' })
  async registerTenant(@Body() dto: RegisterTenantDto) {
    return this.authService.registerTenant(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async me(@CurrentUser() user: any) {
    return { data: user };
  }
}
