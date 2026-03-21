# Phase 2: Müşteri & Araç Yönetimi

## TASK-018: Araç Marka/Model Veritabanı

**Agent**: database
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-011

### Açıklama
Global araç marka ve model tablosu (public schema — tüm tenant'lar paylaşır). Admin panelden yönetilebilir.

### Acceptance Criteria
- [ ] VehicleBrand model (id, name, logo?, country?)
- [ ] VehicleModel model (id, brandId, name, year_start, year_end?, bodyType)
- [ ] Temel marka/model seed data (en az 30 marka, popüler modeller)
- [ ] Public schema'da, tenant-independent

---

## TASK-019: Müşteri CRUD

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-012

### Açıklama
Müşteri yönetimi. Bireysel veya kurumsal, iletişim bilgileri, arama.

### Acceptance Criteria
- [ ] Customer model (id, tenantId, type[individual/company], name, phone, email, address, taxId?, notes)
- [ ] CRUD endpoints (list, get, create, update, soft-delete)
- [ ] Arama: isim, telefon, vergi no ile filtreleme
- [ ] Pagination + sorting

---

## TASK-020: Araç CRUD

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-018

### Açıklama
Araç yönetimi. Plaka, marka, model, yıl, km bilgileri.

### Acceptance Criteria
- [ ] Vehicle model (id, tenantId, licensePlate, brandId, modelId, year, color, vin?, currentKm, notes)
- [ ] CRUD endpoints
- [ ] Plaka ile arama (unique per tenant)
- [ ] Marka/model dropdown data endpoint

---

## TASK-021: Müşteri-Araç İlişkilendirme

**Agent**: backend
**Complexity**: S
**Status**: BLOCKED
**Dependencies**: TASK-019, TASK-020

### Açıklama
Bir müşterinin birden fazla aracı olabilir. Araç sahipliği değişebilir.

### Acceptance Criteria
- [ ] CustomerVehicle pivot model (customerId, vehicleId, isPrimary, since, until?)
- [ ] Müşterinin araçlarını listele
- [ ] Aracın sahiplerini listele (geçmiş dahil)
- [ ] Araç sahiplik transferi

---

## TASK-022: Plaka ile Hızlı Arama

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-021

### Açıklama
Araç girişinde plaka yazılınca müşteri ve araç bilgilerini hızlıca getir. Yoksa yeni kayıt akışına yönlendir.

### Acceptance Criteria
- [ ] GET /api/v1/lookup/plate/:plate → { vehicle, customer, lastServices }
- [ ] Plaka bulunamazsa 404 + yeni kayıt önerisi
- [ ] Debounced search desteği (partial plate match)
- [ ] Response süresi < 200ms

---

## TASK-023: Araç Servis Geçmişi

**Agent**: backend
**Complexity**: S
**Status**: BLOCKED
**Dependencies**: TASK-021

### Açıklama
Bir aracın tüm servis geçmişini görüntüle.

### Acceptance Criteria
- [ ] GET /api/v1/vehicles/:id/service-history
- [ ] Tarih, hizmet, tutar, km bilgisi
- [ ] Pagination
- [ ] Son servis tarihi & km hesaplama

---

## TASK-024: Müşteri Frontend Sayfaları

**Agent**: frontend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-019

### Acceptance Criteria
- [ ] Müşteri listesi (tablo, arama, filtre)
- [ ] Müşteri detay sayfası (bilgiler, araçlar, cari hesap, servis geçmişi)
- [ ] Müşteri ekleme/düzenleme formu
- [ ] Hızlı müşteri ekleme modal

---

## TASK-025: Araç Frontend Sayfaları

**Agent**: frontend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-020

### Acceptance Criteria
- [ ] Araç listesi (tablo, plaka arama)
- [ ] Araç detay sayfası (bilgiler, sahip, servis geçmişi)
- [ ] Araç ekleme/düzenleme formu (marka/model dropdown)
- [ ] Plaka bazlı hızlı giriş alanı
