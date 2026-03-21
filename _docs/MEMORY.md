# Manager — Project Memory

## Project Info
- Multi-tenant oto servis CRM + ön muhasebe platformu (KKTC hedef pazar)
- Horizontal SaaS: wildcard subdomain ({tenant}.manager.app)
- Offline-first PWA, online-first sync

## Project Status
- **Tüm 10 Phase tamamlandı** — 82/82 task (%100)
- Local dev ortamı çalışıyor (API :4000, Web :3002, Admin :3001)
- Production build henüz yapılmadı

## Key Technical Decisions
- Multi-tenancy: Schema-per-tenant (tenant_{slug} PostgreSQL schemas)
- Auth: JWT (access + refresh) + RBAC (role-based access control)
- ORM: Prisma 6 with multi-schema support
- Monorepo: pnpm + Turborepo (apps/api, apps/web, apps/admin, packages/*)
- Backend: NestJS 10 + SWC builder (191 dosya ~60ms build)
- Frontend: Next.js 15 App Router + Tailwind v4 (@tailwindcss/postcss)
- Ön muhasebe: Tek düzen değil, ön büro muhasebe (gelir/gider/cari)
- Stok kuralı: İçeri para girmez, stoktan satış veya hizmet kaydı zorunlu
- Cari hesap: Müşteriden bağımsız entity — 1 müşteri → N cari hesap
- KKTC: Brüt/net maaş, SGK, ihtiyat sandığı, asgari ücret parametreleri düzenlenebilir
- Password hashing: bcryptjs (pure JS — native bcrypt compile sorunları nedeniyle)

## Important Patterns
- Araç giriş akışı: Plaka → Müşteri lookup → Araç seçimi → Hizmet → Fatura
- Hizmet-ürün bağlantısı: "Yağ değişimi" hizmeti → X lt yağ + filtre (stoktan otomatik düşüm)
- Alış/satış fiyatı ayrı: Her ürün için maliyet ve satış fiyatı ayrı tutulur
- Hatırlatma: Servis sonrası X gün sonra otomatik SMS/email/WhatsApp
- İş emri durumları: DRAFT → IN_PROGRESS → COMPLETED → INVOICED (CANCELLED any time)
- Fatura: İş emri COMPLETED olunca oluşturulur, partial payment destekli

## Known Issues / Gotchas
- pdfmake ESM/CJS uyumsuzluğu — fatura PDF generation geçici olarak devre dışı (placeholder)
- Web frontend port 3002'de (3000 başka projede meşgul)
- Tailwind v4 syntax: `@import "tailwindcss"` kullan, `@tailwind base` kullanma
- PostCSS config: `@tailwindcss/postcss` plugin gerekli (hem web hem admin)
- NestJS'te `import type` kullanma DI inject edilen sınıflarda — SWC metadata üretmez

## Working Credentials (Dev)
- Tenant slug: demo
- Email: admin@demo.manager.app
- Password: Admin123!
- 4 default role: admin (*), manager, technician, cashier
