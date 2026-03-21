# Code Conventions

## TypeScript
- Strict mode always enabled
- No `any` types (use `unknown` + type guards)
- Interfaces for object shapes, types for unions/intersections
- Explicit return types on exported functions
- Enums yerine `as const` objects tercih et

## File Naming
- `kebab-case` for all files
- Backend: `.service.ts`, `.controller.ts`, `.module.ts`, `.dto.ts`, `.guard.ts`, `.middleware.ts`
- Frontend: `.tsx` components, `.ts` utils/hooks, `.schema.ts` form validations
- Tests: `.spec.ts` (colocated with source)
- Prisma: `schema.prisma` (tek dosya veya multi-file schema)

## API Design
- RESTful endpoints: `/api/v1/{resource}`
- Multi-tenant header: subdomain'den otomatik resolve
- Consistent pagination: `?page=1&limit=20&sort=createdAt&order=desc`
- Success response: `{ data, meta? }`
- Error response: `{ error: { statusCode, code, message, details? } }`
- HTTP status codes: 200, 201, 400, 401, 403, 404, 409, 422, 500

## Multi-Tenancy
- Her tenant'ın kendi PostgreSQL schema'sı
- Tenant resolve: subdomain → tenant lookup → schema set
- Shared tables (admin): `public` schema
- Tenant tables: `tenant_{slug}` schema
- Cross-tenant query YASAK

## Business Rules
- Para girişi/çıkışı: Sadece stok satışı veya hizmet kaydı üzerinden
- Fiyatlama: Her ürün/hizmet için alış (maliyet) ve satış fiyatı ayrı
- Stok: Hizmet verildiğinde kullanılan malzeme stoktan otomatik düşer
- Cari hesap: Müşteriye bağlı ama ayrı entity — bir müşterinin birden fazla cari hesabı olabilir
- Fatura: Hizmet tamamlandığında otomatik oluşur

## Frontend
- Server Components by default, Client Component sadece interaktivite gerektiğinde
- TanStack Query ile server state, Zustand ile UI state
- Tüm formlar React Hook Form + Zod validation
- Keyboard shortcuts: hızlı erişim için configurable kısayollar
- Responsive: mobile-first tasarım

## Database
- PascalCase model names, camelCase field names
- Soft delete: `deletedAt` field (tüm ana entity'lerde)
- Audit: `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
- UUID primary keys (tenant-safe)

## Testing
- Vitest + Supertest (backend)
- Vitest + Testing Library (frontend)
- Playwright (E2E)
- Happy path + error cases + edge cases
- Mock external services (SMS, WhatsApp)
