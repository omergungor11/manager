# Phase 8: Raporlama & Analitik

## TASK-065: Raporlama Altyapısı

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-046

### Açıklama
Ortak raporlama altyapısı. Tarih aralığı, filtreleme, export (PDF/Excel).

### Acceptance Criteria
- [ ] ReportService (tarih aralığı, filtre, gruplama)
- [ ] Excel export (xlsx)
- [ ] PDF export
- [ ] Rapor cache (Redis, kısa süreli)

---

## TASK-066: Gelir-Gider Raporu

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-065

### Acceptance Criteria
- [ ] Günlük/haftalık/aylık/yıllık gelir-gider dökümü
- [ ] Kategori bazlı gruplama
- [ ] Karşılaştırma (bu ay vs geçen ay)
- [ ] Export desteği

---

## TASK-067: Kâr/Zarar Raporu

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-065

### Acceptance Criteria
- [ ] Ciro (toplam satış)
- [ ] Maliyet (satılan malın maliyeti — costPrice bazlı)
- [ ] Brüt kâr (ciro - maliyet)
- [ ] Giderler (kira, personel, diğer)
- [ ] Net kâr/zarar
- [ ] Dönemsel karşılaştırma

---

## TASK-068: Stok Raporu

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-065, TASK-030

### Acceptance Criteria
- [ ] Mevcut stok durumu (ürün bazlı)
- [ ] Düşük stok uyarı listesi (minStock altındakiler)
- [ ] En çok satılan ürünler (dönemsel)
- [ ] Stok değeri raporu (maliyet bazlı)
- [ ] Stok hareket raporu (giriş/çıkış dökümü)

---

## TASK-069: Müşteri & Araç Raporları

**Agent**: backend
**Complexity**: S
**Status**: BLOCKED
**Dependencies**: TASK-065

### Acceptance Criteria
- [ ] En çok hizmet alan müşteriler
- [ ] En çok gelen araçlar (plaka bazlı)
- [ ] Müşteri başına ortalama harcama
- [ ] Yeni müşteri trendi (aylık)

---

## TASK-070: Rapor Frontend

**Agent**: frontend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-065

### Acceptance Criteria
- [ ] Dashboard ana sayfa (özet kartlar: bugünkü gelir, aylık ciro, açık iş emirleri, düşük stok)
- [ ] Gelir-gider rapor sayfası (grafik + tablo)
- [ ] Kâr/zarar rapor sayfası
- [ ] Stok rapor sayfası
- [ ] Tarih aralığı seçici + filtreler
- [ ] Export butonları (PDF, Excel)
