# Phase 0: Project Setup & Tooling

## TASK-001: Monorepo Init (pnpm + Turborepo)

**Agent**: devops
**Complexity**: S
**Status**: PENDING
**Dependencies**: -

### Açıklama
pnpm workspace + Turborepo ile monorepo yapısını kur. apps/ ve packages/ dizinlerini oluştur.

### Acceptance Criteria
- [ ] pnpm init + pnpm-workspace.yaml
- [ ] turbo.json ile pipeline config
- [ ] Root package.json (workspace scripts)
- [ ] apps/api, apps/web, apps/admin dizinleri oluşturuldu
- [ ] packages/shared, packages/db, packages/ui dizinleri oluşturuldu

---

## TASK-002: Meta Directories

**Agent**: docs
**Complexity**: S
**Status**: PENDING
**Dependencies**: -

### Açıklama
Proje yönetim dizinleri zaten template'den mevcut. İçerikleri projeye özel doldur.

### Acceptance Criteria
- [ ] `_tasks/` task-index.md güncel, phase dosyaları yazılmış
- [ ] `_docs/` MEMORY.md ve CHANGELOG.md projeye özel
- [ ] `_config/` tüm config dosyaları projeye özel doldurulmuş
- [ ] `_plans/` dizini hazır

---

## TASK-003: Claude Code Setup

**Agent**: devops
**Complexity**: M
**Status**: PENDING
**Dependencies**: TASK-001

### Açıklama
.claude/ dizinindeki hooks, commands ve settings dosyalarını projeye göre güncelle.

### Acceptance Criteria
- [ ] protect-files.sh hook çalışıyor
- [ ] 4 slash command projeye özel güncellenmiş
- [ ] settings.local.json — pnpm, npx, turbo komutları izin listesinde
- [ ] Prisma auto-generate hook (opsiyonel)

---

## TASK-004: CLAUDE.md Master Configuration

**Agent**: docs
**Complexity**: M
**Status**: PENDING
**Dependencies**: TASK-002

### Açıklama
CLAUDE.md dosyasını projeye özel tam olarak yaz.

### Acceptance Criteria
- [ ] Proje açıklaması ve workspace layout
- [ ] Slash commands dokümante
- [ ] Code conventions özet
- [ ] Referans dizinleri tablosu
- [ ] Hooks dokümante

---

## TASK-005: Docker Dev Environment

**Agent**: devops
**Complexity**: M
**Status**: PENDING
**Dependencies**: TASK-001

### Açıklama
PostgreSQL 16 + Redis 7 için Docker Compose yapılandırması.

### Acceptance Criteria
- [ ] docker-compose.yml (PostgreSQL :5432, Redis :6379)
- [ ] Health checks tanımlanmış
- [ ] Volume mounts (data persistence)
- [ ] .env.example dosyası (DB credentials, Redis URL)

---

## TASK-006: Lint, Format, TypeScript Config

**Agent**: devops
**Complexity**: S
**Status**: PENDING
**Dependencies**: TASK-001

### Açıklama
Biome (lint + format) ve TypeScript base config.

### Acceptance Criteria
- [ ] biome.json root config
- [ ] tsconfig.base.json (strict, paths)
- [ ] Her app/package için tsconfig.json extends
- [ ] pnpm lint, pnpm format, pnpm typecheck scripts

---

## TASK-007: .gitignore + First Commit

**Agent**: devops
**Complexity**: S
**Status**: PENDING
**Dependencies**: TASK-001..006

### Açıklama
.gitignore oluştur ve tüm Phase 0 dosyalarını commit et.

### Acceptance Criteria
- [ ] .gitignore (node_modules, .env*, dist, .turbo, .next, coverage, prisma/*.db)
- [ ] Tüm Phase 0 dosyaları staged
- [ ] İlk commit: `chore: project scaffold with Claude Code workflow`
