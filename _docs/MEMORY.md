# Manager — Project Memory

## Project Info
- Multi-tenant oto servis CRM + ön muhasebe platformu (KKTC hedef pazar)
- Horizontal SaaS: wildcard subdomain ({tenant}.manager.app)
- Offline-first PWA, online-first sync

## Project Status
- **Phase 0**: PENDING — Project setup & tooling
- **Phase 1-10**: BLOCKED — Phase 0'a bağımlı

## Key Technical Decisions
- Multi-tenancy: Schema-per-tenant (tenant_{slug} PostgreSQL schemas)
- Auth: JWT (access + refresh) + RBAC (role-based access control)
- ORM: Prisma 6 with multi-schema support
- Monorepo: pnpm + Turborepo (apps/api, apps/web, apps/admin, packages/*)
- Backend: NestJS 10 (modüler yapı, guard/middleware/interceptor desteği)
- Frontend: Next.js 15 App Router (wildcard subdomain middleware)
- Ön muhasebe: Tek düzen değil, ön büro muhasebe (gelir/gider/cari)
- Stok kuralı: İçeri para girmez, stoktan satış veya hizmet kaydı zorunlu
- Cari hesap: Müşteriden bağımsız entity — 1 müşteri → N cari hesap
- KKTC: Brüt/net maaş, SGK, ihtiyat sandığı, asgari ücret parametreleri düzenlenebilir

## Important Patterns
- Araç giriş akışı: Plaka → Müşteri lookup → Araç seçimi → Hizmet → Fatura
- Hizmet-ürün bağlantısı: "Yağ değişimi" hizmeti → X lt yağ + filtre (stoktan otomatik düşüm)
- Alış/satış fiyatı ayrı: Her ürün için maliyet ve satış fiyatı ayrı tutulur
- Hatırlatma: Servis sonrası X gün sonra otomatik SMS/email/WhatsApp

## Known Issues / Gotchas
- None yet

## Working Credentials (Dev)
- Seed data ile oluşturulacak (Phase 1, TASK-017)
