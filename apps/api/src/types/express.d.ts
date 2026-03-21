import type { TenantContext } from '../modules/tenant/tenant.decorator';

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}
