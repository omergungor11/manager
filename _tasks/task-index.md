# Manager — Task Index

## Dashboard

| Phase | Name | Total | Done | In Progress | Pending | Blocked |
|-------|------|-------|------|-------------|---------|---------|
| 0 | Project Setup & Tooling | 7 | 7 | 0 | 0 | 0 |
| 1 | Core Infrastructure | 10 | 5 | 0 | 1 | 4 |
| 2 | Müşteri & Araç Yönetimi | 8 | 0 | 0 | 0 | 8 |
| 3 | Hizmet Kataloğu & Stok | 9 | 0 | 0 | 0 | 9 |
| 4 | İş Emirleri & Faturalama | 8 | 0 | 0 | 0 | 8 |
| 5 | Ön Muhasebe & Cari Hesaplar | 8 | 0 | 0 | 0 | 8 |
| 6 | Çalışan & Bordro (KKTC) | 7 | 0 | 0 | 0 | 7 |
| 7 | Bildirimler & Hatırlatmalar | 7 | 0 | 0 | 0 | 7 |
| 8 | Raporlama & Analitik | 6 | 0 | 0 | 0 | 6 |
| 9 | Orchestrator Admin Panel | 6 | 0 | 0 | 0 | 6 |
| 10 | Frontend & PWA | 6 | 0 | 0 | 0 | 6 |
| **Total** | | **82** | **12** | **0** | **1** | **69** |

**Progress**: 12/82 (14%)

---

## Phase 0: Project Setup & Tooling

| ID | Task | Agent | Complexity | Status | Dependencies |
|----|------|-------|-----------|--------|-------------|
| TASK-001 | Monorepo init (pnpm + Turborepo) | devops | S | COMPLETED | - |
| TASK-002 | Meta directories (tasks, plans, docs, config) | docs | S | COMPLETED | - |
| TASK-003 | .claude/ hooks, commands, settings | devops | M | COMPLETED | TASK-001 |
| TASK-004 | CLAUDE.md master configuration | docs | M | COMPLETED | TASK-002 |
| TASK-005 | Docker dev environment (PostgreSQL, Redis) | devops | M | COMPLETED | TASK-001 |
| TASK-006 | Lint, format, TypeScript config (Biome + tsconfig) | devops | S | COMPLETED | TASK-001 |
| TASK-007 | .gitignore + first commit | devops | S | COMPLETED | TASK-001..006 |

## Phase 1: Core Infrastructure

| ID | Task | Agent | Complexity | Status | Dependencies |
|----|------|-------|-----------|--------|-------------|
| TASK-008 | NestJS API scaffold (apps/api) | backend | M | COMPLETED | TASK-007 |
| TASK-009 | Next.js tenant app scaffold (apps/web) | frontend | M | COMPLETED | TASK-007 |
| TASK-010 | Next.js admin panel scaffold (apps/admin) | frontend | M | COMPLETED | TASK-007 |
| TASK-011 | Prisma schema — base models (Tenant, User, Role) | database | L | PENDING | TASK-008 |
| TASK-012 | Multi-tenant middleware (subdomain → schema) | backend | L | BLOCKED | TASK-011 |
| TASK-013 | Auth module (JWT + refresh + RBAC) | backend | L | BLOCKED | TASK-011 |
| TASK-014 | User access control (roles & permissions) | backend | M | BLOCKED | TASK-013 |
| TASK-015 | Wildcard subdomain routing (Nginx + Next.js middleware) | devops | M | COMPLETED | TASK-009 |
| TASK-016 | Shared packages setup (types, utils, UI) | devops | M | COMPLETED | TASK-007 |
| TASK-017 | Seed data (demo tenant, admin user, roles) | database | S | BLOCKED | TASK-014 |

## Phase 2: Müşteri & Araç Yönetimi

| ID | Task | Agent | Complexity | Status | Dependencies |
|----|------|-------|-----------|--------|-------------|
| TASK-018 | Araç marka/model veritabanı (master data) | database | M | BLOCKED | TASK-011 |
| TASK-019 | Müşteri CRUD (kişi/firma, iletişim bilgileri) | backend | M | BLOCKED | TASK-012 |
| TASK-020 | Araç CRUD (plaka, marka, model, yıl, km) | backend | M | BLOCKED | TASK-018 |
| TASK-021 | Müşteri-araç ilişkilendirme | backend | S | BLOCKED | TASK-019, TASK-020 |
| TASK-022 | Plaka ile hızlı müşteri/araç arama | backend | M | BLOCKED | TASK-021 |
| TASK-023 | Araç servis geçmişi görüntüleme | backend | S | BLOCKED | TASK-021 |
| TASK-024 | Müşteri frontend sayfaları | frontend | L | BLOCKED | TASK-019 |
| TASK-025 | Araç frontend sayfaları | frontend | L | BLOCKED | TASK-020 |

## Phase 3: Hizmet Kataloğu & Stok

| ID | Task | Agent | Complexity | Status | Dependencies |
|----|------|-------|-----------|--------|-------------|
| TASK-026 | Hizmet kategorileri & hizmet tanımları CRUD | backend | M | BLOCKED | TASK-012 |
| TASK-027 | Ürün kataloğu CRUD (yağ, filtre, parça vb.) | backend | M | BLOCKED | TASK-012 |
| TASK-028 | Alış fiyatı vs satış fiyatı yönetimi | backend | M | BLOCKED | TASK-027 |
| TASK-029 | Stok giriş (tedarikçiden alım) | backend | M | BLOCKED | TASK-027 |
| TASK-030 | Stok çıkış (hizmet verildiğinde otomatik düşüm) | backend | M | BLOCKED | TASK-029 |
| TASK-031 | Stok sayım & düzeltme | backend | S | BLOCKED | TASK-029 |
| TASK-032 | Hizmet-ürün ilişkisi (yağ değişimi → X lt yağ + filtre) | backend | M | BLOCKED | TASK-026, TASK-027 |
| TASK-033 | Stok & ürün frontend sayfaları | frontend | L | BLOCKED | TASK-027 |
| TASK-034 | Hizmet kataloğu frontend | frontend | M | BLOCKED | TASK-026 |

## Phase 4: İş Emirleri & Faturalama

| ID | Task | Agent | Complexity | Status | Dependencies |
|----|------|-------|-----------|--------|-------------|
| TASK-035 | İş emri oluşturma (araç giriş → hizmet seçimi) | backend | L | BLOCKED | TASK-022, TASK-032 |
| TASK-036 | İş emri durumları (açık → devam → tamamlandı → faturalandı) | backend | M | BLOCKED | TASK-035 |
| TASK-037 | İş emrinde stoktan otomatik malzeme düşümü | backend | M | BLOCKED | TASK-035, TASK-030 |
| TASK-038 | Otomatik fatura oluşturma | backend | L | BLOCKED | TASK-036 |
| TASK-039 | Fatura PDF oluşturma | backend | M | BLOCKED | TASK-038 |
| TASK-040 | Ödeme kayıt (nakit, kart, havale, cari hesaba yaz) | backend | M | BLOCKED | TASK-038 |
| TASK-041 | İş emri frontend (hızlı akış: plaka → müşteri → hizmet → ödeme) | frontend | L | BLOCKED | TASK-035 |
| TASK-042 | Fatura frontend sayfaları | frontend | M | BLOCKED | TASK-038 |

## Phase 5: Ön Muhasebe & Cari Hesaplar

| ID | Task | Agent | Complexity | Status | Dependencies |
|----|------|-------|-----------|--------|-------------|
| TASK-043 | Cari hesap modülü (müşteri/tedarikçi cari) | backend | L | BLOCKED | TASK-019 |
| TASK-044 | Cari hesap hareketleri (borç/alacak) | backend | M | BLOCKED | TASK-043 |
| TASK-045 | Müşteri-cari hesap ilişkisi (1 müşteri → N cari) | backend | M | BLOCKED | TASK-043 |
| TASK-046 | Gelir kayıtları (fatura → otomatik gelir) | backend | M | BLOCKED | TASK-038, TASK-043 |
| TASK-047 | Gider kayıtları (kira, fatura, tedarik vb.) | backend | M | BLOCKED | TASK-043 |
| TASK-048 | Kasa/banka hesapları | backend | M | BLOCKED | TASK-043 |
| TASK-049 | Cari hesap frontend sayfaları | frontend | L | BLOCKED | TASK-043 |
| TASK-050 | Gelir/gider frontend sayfaları | frontend | M | BLOCKED | TASK-046, TASK-047 |

## Phase 6: Çalışan & Bordro (KKTC)

| ID | Task | Agent | Complexity | Status | Dependencies |
|----|------|-------|-----------|--------|-------------|
| TASK-051 | Çalışan CRUD (kişisel bilgi, pozisyon, başlangıç) | backend | M | BLOCKED | TASK-012 |
| TASK-052 | KKTC maaş hesaplama (brüt → net, SGK, ihtiyat sandığı) | backend | L | BLOCKED | TASK-051 |
| TASK-053 | Asgari ücret & SGK parametre yönetimi (ayarlanabilir) | backend | M | BLOCKED | TASK-052 |
| TASK-054 | Aylık bordro oluşturma | backend | M | BLOCKED | TASK-052 |
| TASK-055 | Çalışan giderleri (maaş → otomatik gider kaydı) | backend | M | BLOCKED | TASK-054, TASK-047 |
| TASK-056 | Çalışan frontend sayfaları | frontend | L | BLOCKED | TASK-051 |
| TASK-057 | Bordro frontend sayfaları | frontend | M | BLOCKED | TASK-054 |

## Phase 7: Bildirimler & Hatırlatmalar

| ID | Task | Agent | Complexity | Status | Dependencies |
|----|------|-------|-----------|--------|-------------|
| TASK-058 | Notification altyapısı (BullMQ queue) | backend | M | BLOCKED | TASK-012 |
| TASK-059 | SMS gateway entegrasyonu | backend | M | BLOCKED | TASK-058 |
| TASK-060 | Email gönderim servisi | backend | M | BLOCKED | TASK-058 |
| TASK-061 | WhatsApp Business API entegrasyonu | backend | L | BLOCKED | TASK-058 |
| TASK-062 | Servis hatırlatma motoru (X gün sonra otomatik) | backend | L | BLOCKED | TASK-058, TASK-036 |
| TASK-063 | Hatırlatma kuralları yönetimi (tenant ayarları) | backend | M | BLOCKED | TASK-062 |
| TASK-064 | Bildirim frontend sayfaları & ayarları | frontend | M | BLOCKED | TASK-058 |

## Phase 8: Raporlama & Analitik

| ID | Task | Agent | Complexity | Status | Dependencies |
|----|------|-------|-----------|--------|-------------|
| TASK-065 | Raporlama altyapısı (tarih aralığı, filtre, export) | backend | M | BLOCKED | TASK-046 |
| TASK-066 | Gelir-gider raporu | backend | M | BLOCKED | TASK-065 |
| TASK-067 | Kâr/zarar raporu (ciro, maliyet, net kâr) | backend | M | BLOCKED | TASK-065 |
| TASK-068 | Stok raporu (düşen stoklar, en çok satılanlar) | backend | M | BLOCKED | TASK-065, TASK-030 |
| TASK-069 | Müşteri & araç raporları | backend | S | BLOCKED | TASK-065 |
| TASK-070 | Rapor frontend sayfaları (grafikler, tablolar, export) | frontend | L | BLOCKED | TASK-065 |

## Phase 9: Orchestrator Admin Panel

| ID | Task | Agent | Complexity | Status | Dependencies |
|----|------|-------|-----------|--------|-------------|
| TASK-071 | Super admin auth & panel layout | frontend | M | BLOCKED | TASK-010, TASK-013 |
| TASK-072 | Tenant yönetimi (oluştur, dondur, sil) | backend | L | BLOCKED | TASK-012 |
| TASK-073 | Araç marka/model DB yönetimi (admin'den güncelle) | backend | M | BLOCKED | TASK-018 |
| TASK-074 | Global ayarlar (SMS gateway, KKTC parametreleri) | backend | M | BLOCKED | TASK-072 |
| TASK-075 | Tenant istatistikleri & monitoring | backend | M | BLOCKED | TASK-072 |
| TASK-076 | Admin panel frontend sayfaları | frontend | L | BLOCKED | TASK-071 |

## Phase 10: Frontend & PWA

| ID | Task | Agent | Complexity | Status | Dependencies |
|----|------|-------|-----------|--------|-------------|
| TASK-077 | PWA setup (service worker, manifest, offline cache) | frontend | L | BLOCKED | TASK-009 |
| TASK-078 | Offline-first data sync (IndexedDB + server sync) | frontend | L | BLOCKED | TASK-077 |
| TASK-079 | Keyboard shortcuts sistemi | frontend | M | BLOCKED | TASK-009 |
| TASK-080 | Detaylı ayarlar sayfası (tenant settings) | frontend | L | BLOCKED | TASK-063 |
| TASK-081 | Local yedekleme (IndexedDB export/import) | frontend | M | BLOCKED | TASK-078 |
| TASK-082 | Responsive mobile optimization | frontend | M | BLOCKED | TASK-077 |
