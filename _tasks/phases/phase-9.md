# Phase 9: Orchestrator Admin Panel

## TASK-071: Super Admin Auth & Layout

**Agent**: frontend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-010, TASK-013

### Açıklama
Orchestrator admin paneli. Sadece super admin rolü erişir. Tüm tenant'ları yönetir.

### Acceptance Criteria
- [ ] Super admin login (ayrı auth endpoint veya role-check)
- [ ] Admin panel layout (sidebar: Tenants, Vehicles DB, Settings, Monitoring)
- [ ] Super admin guard (backend + frontend)

---

## TASK-072: Tenant Yönetimi

**Agent**: backend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-012

### Açıklama
Tenant CRUD: oluştur, düzenle, dondur, sil. Tenant oluşturulunca schema ve default data otomatik kurulur.

### Acceptance Criteria
- [ ] Tenant oluşturma → PostgreSQL schema create + migration + seed
- [ ] Tenant dondurma (login block, data korunur)
- [ ] Tenant silme (soft-delete, schema archive)
- [ ] Tenant listesi + detay + arama
- [ ] Tenant plan/paket yönetimi (free, pro, enterprise)

---

## TASK-073: Araç Marka/Model DB Yönetimi

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-018

### Acceptance Criteria
- [ ] Admin panelden marka ekleme/düzenleme/silme
- [ ] Admin panelden model ekleme/düzenleme
- [ ] CSV import (toplu marka/model yükleme)
- [ ] Tüm tenant'lar otomatik güncellenir (public schema)

---

## TASK-074: Global Ayarlar

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-072

### Acceptance Criteria
- [ ] SMS gateway global config
- [ ] KKTC default parametreleri (yeni tenant'a otomatik uygulanır)
- [ ] Email SMTP global config
- [ ] Uygulama versiyonu ve feature flags

---

## TASK-075: Tenant İstatistikleri

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-072

### Acceptance Criteria
- [ ] Tenant bazlı: aktif kullanıcı sayısı, iş emri sayısı, aylık ciro
- [ ] Tüm tenant'lar özet dashboard
- [ ] Disk/storage kullanımı
- [ ] Son aktivite tarihi

---

## TASK-076: Admin Panel Frontend

**Agent**: frontend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-071

### Acceptance Criteria
- [ ] Tenant listesi sayfası (durum, plan, istatistik)
- [ ] Tenant detay sayfası (düzenle, dondur, sil)
- [ ] Araç marka/model yönetim sayfası
- [ ] Global ayarlar sayfası
- [ ] Monitoring dashboard
