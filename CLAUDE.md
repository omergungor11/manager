# Manager — Oto Servis Yönetim Platformu

## Proje

Multi-tenant (horizontal SaaS) oto servis/makinistlere özel CRM + ön muhasebe platformu. Araç akışı, stok yönetimi, hizmet satışı, faturalama, cari hesaplar, çalışan yönetimi, hatırlatmalar ve raporlama.

- **Mimari**: Wildcard subdomain multi-tenancy (`{tenant}.manager.app`)
- **Hedef**: KKTC oto servis işletmeleri

## Slash Commandlar

| Command | Ne yapar |
|---------|----------|
| `/cold-start` | Session başlangıcı — projeyi oku, durumu raporla |
| `/git-full` | Stage, commit, push — task durumlarını güncelle |
| `/local-testing` | Tüm servisleri ayağa kaldır ve doğrula |
| `/turn-off` | Session notu yaz, taskları işaretle, push, kapat |

---

## Mevcut Durum

**Progress**: 15/82 task (%18) — Phase 0 tamamlandı, Phase 1 devam ediyor (TASK-014, TASK-017 kaldı).

> Her yeni session'da `_tasks/task-index.md` oku veya `/cold-start` çalıştır.

---

## Workspace

```
manager/
├── apps/
│   ├── api/          → Backend (NestJS) :4000
│   ├── web/          → Frontend (Next.js) :3000
│   └── admin/        → Orchestrator Admin Panel (Next.js) :3001
├── packages/
│   ├── shared/       → Shared types, utils, constants
│   ├── db/           → Prisma schema, migrations, seed
│   └── ui/           → Shared UI components
├── docker/           → Docker configs
├── _tasks/           → Task tracking
├── _config/          → Proje kuralları
├── _docs/            → Hafıza & changelog
├── _plans/           → Uygulama planları
└── .claude/          → Claude Code config
```

## Temel Komutlar

```bash
pnpm dev                    # Tüm dev server'ları başlat
pnpm dev:api                # Sadece API
pnpm dev:web                # Sadece Frontend
pnpm dev:admin              # Sadece Admin Panel
pnpm build                  # Build all
pnpm typecheck              # TypeScript check
pnpm lint                   # ESLint
pnpm db:generate            # Prisma generate
pnpm db:migrate             # Prisma migrate
pnpm db:seed                # Seed data
pnpm test                   # Run tests
```

---

## Code Conventions (Kısa)

- **TypeScript**: strict, `any` yasak
- **Dosya**: `kebab-case`, `.service.ts` / `.controller.ts` / `.module.ts` / `.dto.ts`
- **API**: RESTful, response `{ data, meta? }`, error `{ error: { statusCode, code, message } }`
- **Multi-tenant**: Her request'te `x-tenant-id` header veya subdomain'den resolve
- **Stok kuralı**: Para girişi/çıkışı sadece stok satışı veya hizmet kaydı üzerinden
- **Commit**: `feat(TASK-XXX): açıklama` + `Co-Authored-By: Claude <noreply@anthropic.com>`

Detaylar → `_config/conventions.md`

## Parallel Agent Orchestration

Birden fazla sub-agent paralel çalıştırılırken:
- Her agent sadece kendi modül dizininde dosya düzenler (dizin izolasyonu)
- Paket kurulumu sadece ana agent (orchestrator) tarafından yapılır
- Paylaşılan dosyalarda retry pattern uygulanır
- Bağımlı task'lar sıralı, bağımsız olanlar paralel çalıştırılır

Detaylar → `_config/agent-instructions.md`

---

## Referans Dizinleri

| Dizin | İçerik |
|-------|--------|
| `_tasks/` | Task takip — dashboard + tüm task'lar |
| `_tasks/task-index.md` | Master task listesi |
| `_tasks/phases/` | Phase bazlı detaylı task açıklamaları |
| `_tasks/active/session-notes.md` | Session notları |
| `_config/workflow.md` | Task workflow kuralları |
| `_config/conventions.md` | Kod standartları |
| `_config/tech-stack.md` | Teknolojiler + versiyonlar |
| `_config/agent-instructions.md` | Sub-agent sorumlulukları |
| `_docs/MEMORY.md` | Kalıcı hafıza |
| `_docs/CHANGELOG.md` | Değişiklik kaydı |
| `_plans/` | Uygulama planları |

---

## Hooks (Otomatik Kurallar)

| Hook | Tetikleyici | Ne yapar |
|------|------------|----------|
| `protect-files.sh` | PreToolUse (Edit/Write) | .env, lock files, .git/ düzenlemeyi bloklar |

---

## Notlar

- Hafıza dosyası `_docs/MEMORY.md`'de — her session'da oku, gerektiğinde güncelle
- KKTC'ye özel maaş hesaplamaları (SGK, ihtiyat sandığı, asgari ücret)
- Offline-first PWA — local yedekleme + online sync
- Fiyatlama: alış fiyatı ≠ satış fiyatı (her ürün/hizmet için ayrı)
