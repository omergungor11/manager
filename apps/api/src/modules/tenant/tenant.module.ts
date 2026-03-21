import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { TenantMiddleware } from './tenant.middleware';

@Module({
  providers: [TenantMiddleware],
  exports: [TenantMiddleware],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude('/api/v1/health', '/api/docs', '/api/v1/auth/register-tenant')
      .forRoutes('*');
  }
}
