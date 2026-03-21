# Phase 4: İş Emirleri & Faturalama

## TASK-035: İş Emri Oluşturma

**Agent**: backend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-022, TASK-032

### Açıklama
Araç girişi → hizmet seçimi → malzeme listesi → iş emri oluşturma. Ana iş akışı.

### Acceptance Criteria
- [ ] WorkOrder model (id, tenantId, customerId, vehicleId, status, currentKm, technicianId?, notes, createdAt)
- [ ] WorkOrderItem model (id, workOrderId, type[service/product], serviceDefId?, productId?, description, quantity, unitPrice, total)
- [ ] İş emri oluşturma endpoint (plaka → müşteri → hizmet seçimi → ürünler)
- [ ] Hizmet seçildiğinde default ürünler otomatik eklenir
- [ ] Ürün miktarı ve fiyatı override edilebilir

---

## TASK-036: İş Emri Durumları

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-035

### Açıklama
İş emri yaşam döngüsü: açık → devam ediyor → tamamlandı → faturalandı.

### Acceptance Criteria
- [ ] Status enum: DRAFT, IN_PROGRESS, COMPLETED, INVOICED, CANCELLED
- [ ] Status geçiş kuralları (DRAFT→IN_PROGRESS, IN_PROGRESS→COMPLETED, vb.)
- [ ] Status değişim log'u
- [ ] COMPLETED olunca stoktan düşüm tetiklenir

---

## TASK-037: Stoktan Otomatik Malzeme Düşümü

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-035, TASK-030

### Açıklama
İş emri COMPLETED olduğunda, kullanılan ürünler stoktan düşer.

### Acceptance Criteria
- [ ] WorkOrder COMPLETED → her WorkOrderItem(type=product) için StockMovement(type=out) oluştur
- [ ] Stok yetersizse: ayara göre uyar veya durdur
- [ ] İş emri iptalinde stok iade (geri ekleme)

---

## TASK-038: Otomatik Fatura Oluşturma

**Agent**: backend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-036

### Açıklama
İş emri tamamlandığında otomatik fatura oluştur.

### Acceptance Criteria
- [ ] Invoice model (id, tenantId, workOrderId, customerId, invoiceNo, date, subtotal, taxRate, taxAmount, total, status, dueDate)
- [ ] InvoiceItem model (id, invoiceId, description, quantity, unitPrice, total)
- [ ] Otomatik fatura numarası (tenant bazlı sıralı)
- [ ] İş emri item'larından fatura item oluşturma
- [ ] Fatura status: DRAFT, SENT, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED

---

## TASK-039: Fatura PDF Oluşturma

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-038

### Acceptance Criteria
- [ ] PDF template (tenant logo, bilgileri, müşteri bilgileri, kalemler, toplam)
- [ ] PDF generation (puppeteer veya pdfmake)
- [ ] GET /api/v1/invoices/:id/pdf → PDF download
- [ ] Tenant bazlı fatura şablonu ayarları

---

## TASK-040: Ödeme Kayıt

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-038

### Açıklama
Fatura ödemesi: nakit, kart, havale veya cari hesaba yaz.

### Acceptance Criteria
- [ ] Payment model (id, tenantId, invoiceId, amount, method[cash/card/transfer/account], date, notes)
- [ ] Kısmi ödeme desteği
- [ ] Cari hesaba yazma (cari hareket oluşturma)
- [ ] Fatura status otomatik güncelleme (PAID, PARTIALLY_PAID)

---

## TASK-041: İş Emri Frontend

**Agent**: frontend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-035

### Açıklama
Ana iş akışı arayüzü. Hızlı ve kolay kullanım öncelikli.

### Acceptance Criteria
- [ ] Yeni iş emri: Plaka gir → Müşteri/araç seç → Hizmet ekle → Ürün ekle → Kaydet
- [ ] İş emri listesi (aktif, tamamlanan, faturalanmış)
- [ ] İş emri detay (durumu değiştir, item ekle/çıkar)
- [ ] Hızlı kısayollar (F2: yeni iş emri, F3: plaka arama)
- [ ] Gerçek zamanlı toplam hesaplama

---

## TASK-042: Fatura Frontend

**Agent**: frontend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-038

### Acceptance Criteria
- [ ] Fatura listesi (tablo, durum filtre, tarih aralığı)
- [ ] Fatura detay (PDF önizleme, yazdır, indir)
- [ ] Ödeme kayıt modal (tutar, yöntem)
- [ ] Fatura arama (numara, müşteri)
