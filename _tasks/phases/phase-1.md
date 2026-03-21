# Phase 1: Core Infrastructure

## TASK-008: NestJS API Scaffold

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-007

### Açıklama
apps/api altında NestJS uygulaması kur. Global exception filter, response interceptor, health check endpoint.

### Acceptance Criteria
- [ ] NestJS app running on :4000
- [ ] Global exception filter (standart error format)
- [ ] Response interceptor ({ data, meta? } format)
- [ ] Health check: GET /api/health
- [ ] Swagger/OpenAPI setup
- [ ] Environment config module (.env okuma)

---

## TASK-009: Next.js Tenant App Scaffold

**Agent**: frontend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-007

### Açıklama
apps/web altında Next.js 15 App Router uygulaması. Wildcard subdomain middleware hazırlığı.

### Acceptance Criteria
- [ ] Next.js app running on :3000
- [ ] App Router layout (auth layout + dashboard layout)
- [ ] Tailwind CSS + shadcn/ui kurulumu
- [ ] Middleware: subdomain okuma ve tenant context sağlama
- [ ] Auth pages placeholder (login, register)

---

## TASK-010: Next.js Admin Panel Scaffold

**Agent**: frontend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-007

### Açıklama
apps/admin altında orchestrator admin paneli. Sadece super admin erişimi.

### Acceptance Criteria
- [ ] Next.js app running on :3001
- [ ] Admin layout (sidebar + content)
- [ ] shadcn/ui + Tailwind CSS kurulumu
- [ ] Super admin login page

---

## TASK-011: Prisma Schema — Base Models

**Agent**: database
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-008

### Açıklama
packages/db altında Prisma schema. Multi-tenant için base modeller.

### Acceptance Criteria
- [ ] Prisma init + PostgreSQL connection
- [ ] Tenant model (id, name, slug, domain, status, settings, plan)
- [ ] User model (id, tenantId, email, password, name, phone, role, status)
- [ ] Role model (id, tenantId, name, permissions[])
- [ ] AuditLog model (id, tenantId, userId, action, entity, entityId, data)
- [ ] Base migration çalışıyor

---

## TASK-012: Multi-Tenant Middleware

**Agent**: backend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-011

### Açıklama
Request'ten subdomain okuyup tenant resolve eden middleware. Prisma'yı tenant schema'sına yönlendiren servis.

### Acceptance Criteria
- [ ] TenantMiddleware: subdomain → tenant lookup
- [ ] TenantService: schema switching (SET search_path)
- [ ] Request context'e tenant bilgisi ekleniyor
- [ ] Tenant bulunamazsa 404
- [ ] Tenant inactive ise 403

---

## TASK-013: Auth Module (JWT + RBAC)

**Agent**: backend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-011

### Açıklama
JWT tabanlı authentication + role-based authorization.

### Acceptance Criteria
- [ ] Login endpoint (email + password → access + refresh token)
- [ ] Register endpoint (tenant admin kayıt)
- [ ] Refresh token endpoint
- [ ] JWT guard (access token doğrulama)
- [ ] Password hashing (bcrypt)
- [ ] Token blacklist (Redis)

---

## TASK-014: User Access Control

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-013

### Açıklama
RBAC sistemi. Role'ler ve permission'lar tenant bazında yönetilir.

### Acceptance Criteria
- [ ] Default roles: admin, manager, technician, cashier
- [ ] Permission decorator (@RequirePermission('invoice:create'))
- [ ] Role CRUD endpoints
- [ ] User-role assignment endpoints
- [ ] Permission check guard

---

## TASK-015: Wildcard Subdomain Routing

**Agent**: devops
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-009

### Açıklama
Nginx wildcard SSL + Next.js middleware ile subdomain routing.

### Acceptance Criteria
- [ ] Nginx config: *.manager.app → Next.js
- [ ] Next.js middleware: subdomain parse → tenant context
- [ ] Dev ortamında *.localhost:3000 çalışıyor
- [ ] Tenant slug validation

---

## TASK-016: Shared Packages Setup

**Agent**: devops
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-007

### Açıklama
packages/shared (types, utils, constants), packages/db (Prisma), packages/ui (shared components).

### Acceptance Criteria
- [ ] packages/shared: TypeScript types, helper functions, constants export
- [ ] packages/db: Prisma client export, re-usable
- [ ] packages/ui: shadcn/ui components shared between web & admin
- [ ] Tüm packages apps tarafından import edilebiliyor

---

## TASK-017: Seed Data

**Agent**: database
**Complexity**: S
**Status**: BLOCKED
**Dependencies**: TASK-014

### Açıklama
Demo tenant, admin user, roller ve temel veriler.

### Acceptance Criteria
- [ ] Demo tenant: "Demo Oto Servis" (slug: demo)
- [ ] Admin user: admin@demo.manager.app / Admin123!
- [ ] 4 default role oluşturulmuş
- [ ] pnpm db:seed komutu çalışıyor
