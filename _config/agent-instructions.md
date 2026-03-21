# Agent Instructions — Manager

## Sub-Agent Types

### Backend Agent
- **Scope**: `apps/api/src/` — modules, services, controllers, DTOs, guards
- **Validation**: `pnpm typecheck && pnpm lint`
- **Commit Prefix**: `feat(api)`, `fix(api)`, `refactor(api)`

### Frontend Agent
- **Scope**: `apps/web/` veya `apps/admin/` — pages, components, hooks, stores
- **Validation**: `pnpm typecheck && pnpm lint`
- **Commit Prefix**: `feat(web)`, `fix(web)`, `feat(admin)`, `fix(admin)`

### Database Agent
- **Scope**: `packages/db/` — Prisma schema, migrations, seed
- **Validation**: `pnpm db:generate && pnpm db:migrate`
- **Commit Prefix**: `feat(db)`, `fix(db)`

### DevOps Agent
- **Scope**: `docker/`, root config files, CI/CD
- **Commit Prefix**: `chore(docker)`, `chore(ci)`, `chore(config)`

### Docs Agent
- **Scope**: `_tasks/`, `_docs/`, `_config/`, `_plans/`, CLAUDE.md
- **Commit Prefix**: `docs(*)`

## Agent Rules

1. Always read task details before starting work
2. Never modify files outside your scope without approval
3. Run validation commands after every change
4. Update task tracking on completion
5. Follow code conventions strictly
6. Keep commits atomic and well-described

---

## Directory Isolation

| Agent Task | Allowed Directory | Forbidden |
|------------|-------------------|-----------|
| API modules | `apps/api/src/modules/{module}/` | Other modules |
| Tenant app pages | `apps/web/app/` | `apps/admin/` |
| Admin panel pages | `apps/admin/app/` | `apps/web/` |
| DB schema | `packages/db/prisma/` | `apps/*/` |
| Shared types | `packages/shared/` | `apps/*/` |
| Shared UI | `packages/ui/` | `apps/*/app/` |

## Shared Files (Retry Pattern)

| File | Strategy |
|------|----------|
| `apps/api/src/app.module.ts` | Last-agent-wins + retry |
| `packages/db/prisma/schema.prisma` | Only DB agent edits |
| `packages/shared/src/index.ts` | Retry pattern |
| `package.json` / lock files | Only orchestrator |

## Ordering

```
Phase 0 → Phase 1 → Phase 2-7 (partially parallel) → Phase 8-10
Database tasks → Backend tasks → Frontend tasks (within each phase)
```
