# Changelog

## 2026-03-21

### Added
- TASK-001: Monorepo scaffold (pnpm workspace + Turborepo)
- TASK-002: Meta directories (_tasks, _docs, _config, _plans) with project-specific content
- TASK-003: .claude/ hooks (protect-files.sh), commands, settings.local.json
- TASK-004: CLAUDE.md master configuration for Manager project
- TASK-005: Docker dev environment (PostgreSQL 16, Redis 7)
- TASK-006: Biome (lint + format) + TypeScript strict config
- TASK-007: .gitignore + project scaffold
- TASK-008: NestJS API scaffold (apps/api) with health endpoint + Swagger
- TASK-009: Next.js 15 tenant app (apps/web) with subdomain middleware
- TASK-010: Next.js 15 admin panel (apps/admin)
- TASK-015: Wildcard subdomain routing (Next.js middleware)
- TASK-016: Shared packages (shared types, db/Prisma, UI)
- TASK-014: User access control — RBAC guard, permissions, role CRUD, user-role assignment
- TASK-017: Seed data — demo tenant, 20 araç markası/123 model, 4 default role, admin user
- TASK-018: Vehicle brand/model API — list/search brands, list models by brand
- TASK-019: Customer CRUD — create, read, update, soft-delete with search, pagination, sorting
- TASK-020: Vehicle CRUD — plate search, brand/model lookup, pagination
- TASK-026: Service catalog — categories + service definitions CRUD
- TASK-027: Product catalog — product categories, CRUD, low-stock alerts, cost/sale pricing
- TASK-021: Customer-vehicle linking — assign, unassign, transfer ownership, set primary
- TASK-028: Price management — price history, bulk update, margin calculation
- TASK-029: Stock entry — supplier receiving, bulk entry, stock movements, auto currentStock update
- TASK-032: Service-product linking — default materials per service definition
