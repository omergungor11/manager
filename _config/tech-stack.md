# Tech Stack

## Runtime
- Node.js 20 LTS
- Package manager: pnpm 9+
- Monorepo: Turborepo

## Backend
- Framework: NestJS 10
- Language: TypeScript 5.5+
- ORM: Prisma 6
- Queue: BullMQ (hatırlatmalar, SMS kuyruk, fatura oluşturma)
- Validation: class-validator + class-transformer
- Auth: JWT (access + refresh token) + RBAC
- Multi-tenancy: Subdomain-based tenant resolution + Prisma middleware

## Frontend (Tenant App)
- Framework: Next.js 15 (App Router)
- UI Library: shadcn/ui + Radix
- Styling: Tailwind CSS 4
- State: TanStack Query (server) + Zustand (client)
- Forms: React Hook Form + Zod
- PWA: next-pwa (offline-first, local backup)
- Tables: TanStack Table

## Frontend (Admin Panel)
- Framework: Next.js 15 (App Router)
- UI: shadcn/ui + Tailwind CSS 4
- Aynı shared packages kullanır

## Database
- Primary: PostgreSQL 16
- Cache: Redis 7 (session, cache, BullMQ)
- Strategy: Shared DB, schema-per-tenant (tenant isolation)

## Notifications
- SMS: SMS gateway (configurable per tenant)
- Email: Nodemailer + SMTP / Resend
- WhatsApp: WhatsApp Business API (wapi.js veya official API)

## Infrastructure
- Container: Docker + docker-compose
- CI/CD: GitHub Actions
- Hosting: VPS (Hetzner/DigitalOcean) veya self-hosted
- Reverse Proxy: Nginx (wildcard SSL + subdomain routing)

## Testing
- Unit/Integration: Vitest
- E2E: Playwright
- API Testing: Supertest
