# Phase 3: Hizmet Kataloğu & Stok

## TASK-026: Hizmet Kategorileri & Hizmet Tanımları

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-012

### Açıklama
Hizmet kategorileri (yağ değişimi, bakım, tamir vb.) ve altındaki hizmet tanımları.

### Acceptance Criteria
- [ ] ServiceCategory model (id, tenantId, name, description, sortOrder)
- [ ] ServiceDefinition model (id, tenantId, categoryId, name, description, defaultPrice, estimatedDuration, isActive)
- [ ] CRUD endpoints (category + service)
- [ ] Hizmetleri kategoriye göre gruplama

---

## TASK-027: Ürün Kataloğu CRUD

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-012

### Açıklama
Ürün/malzeme tanımları. Yağ, filtre, parça, sarf malzeme vb.

### Acceptance Criteria
- [ ] Product model (id, tenantId, sku, name, category, unit, costPrice, salePrice, minStock, isActive)
- [ ] ProductCategory model (id, tenantId, name)
- [ ] CRUD endpoints
- [ ] Ürün arama ve filtreleme

---

## TASK-028: Alış vs Satış Fiyatı Yönetimi

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-027

### Açıklama
Her ürünün alış (maliyet) ve satış fiyatı ayrı. Kâr marjı hesaplama.

### Acceptance Criteria
- [ ] costPrice (tedarikçiden alış) ve salePrice (müşteriye satış) ayrı field
- [ ] Fiyat geçmişi (PriceHistory model)
- [ ] Toplu fiyat güncelleme endpoint
- [ ] Kâr marjı: ((sale - cost) / sale) * 100

---

## TASK-029: Stok Giriş

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-027

### Açıklama
Tedarikçiden mal alımı → stok artışı.

### Acceptance Criteria
- [ ] StockEntry model (id, tenantId, productId, quantity, unitCost, supplierId?, invoiceNo?, date, notes)
- [ ] Stok giriş endpoint
- [ ] Product.currentStock otomatik güncelleme
- [ ] Toplu stok giriş (birden fazla ürün tek seferde)

---

## TASK-030: Stok Çıkış (Otomatik Düşüm)

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-029

### Açıklama
Hizmet verildiğinde kullanılan malzemeler stoktan otomatik düşer.

### Acceptance Criteria
- [ ] StockMovement model (id, tenantId, productId, type[in/out/adjust], quantity, referenceType, referenceId, date)
- [ ] Hizmet tamamlandığında: ilişkili ürünler stoktan düşer
- [ ] Stok yetersizse uyarı (işlem durdurma opsiyonel, tenant ayarı)
- [ ] Stok hareket geçmişi

---

## TASK-031: Stok Sayım & Düzeltme

**Agent**: backend
**Complexity**: S
**Status**: BLOCKED
**Dependencies**: TASK-029

### Acceptance Criteria
- [ ] Stok sayım endpoint (fiziksel sayım → fark raporlama)
- [ ] Düzeltme hareketi (type: adjust)
- [ ] Düzeltme sebebi kaydı

---

## TASK-032: Hizmet-Ürün İlişkisi

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-026, TASK-027

### Açıklama
Bir hizmet tanımına default malzeme listesi bağla. Örn: "Yağ değişimi" → 4lt motor yağı + yağ filtresi.

### Acceptance Criteria
- [ ] ServiceProduct model (serviceDefinitionId, productId, defaultQuantity)
- [ ] Hizmet seçildiğinde otomatik malzeme önerisi
- [ ] İş emrinde miktar override edilebilir
- [ ] CRUD endpoint

---

## TASK-033: Stok & Ürün Frontend

**Agent**: frontend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-027

### Acceptance Criteria
- [ ] Ürün listesi (tablo, arama, kategori filtre)
- [ ] Ürün ekleme/düzenleme formu (alış/satış fiyatı)
- [ ] Stok durumu dashboard (düşük stok uyarıları)
- [ ] Stok giriş formu
- [ ] Stok hareket geçmişi

---

## TASK-034: Hizmet Kataloğu Frontend

**Agent**: frontend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-026

### Acceptance Criteria
- [ ] Hizmet kategorileri listesi
- [ ] Hizmet tanımları (fiyat, süre, ilişkili ürünler)
- [ ] Hizmet ekleme/düzenleme formu
- [ ] Kategori yönetimi
