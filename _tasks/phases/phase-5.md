# Phase 5: Ön Muhasebe & Cari Hesaplar

## TASK-043: Cari Hesap Modülü

**Agent**: backend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-019

### Açıklama
Cari hesap sistemi. Müşteri ve tedarikçi cari hesapları. Müşteriden bağımsız entity ama ilişkilendirilebilir. Bir müşterinin birden fazla cari hesabı olabilir.

### Acceptance Criteria
- [ ] Account model (id, tenantId, code, name, type[customer/supplier/other], balance, creditLimit?, phone?, email?, address?, notes)
- [ ] CustomerAccount pivot (customerId, accountId) — 1 müşteri → N cari
- [ ] Cari hesap CRUD endpoints
- [ ] Cari hesap arama (isim, kod, telefon)
- [ ] Bakiye hesaplama (borç - alacak)

---

## TASK-044: Cari Hesap Hareketleri

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-043

### Açıklama
Borç/alacak hareketleri. Fatura → borç, ödeme → alacak.

### Acceptance Criteria
- [ ] AccountTransaction model (id, tenantId, accountId, type[debit/credit], amount, description, referenceType[invoice/payment/expense/manual], referenceId?, date, balance_after)
- [ ] Hareket oluşturma endpoint
- [ ] Cari hesap ekstresi (tarih aralığı, borç/alacak toplamı)
- [ ] Bakiye otomatik güncelleme

---

## TASK-045: Müşteri-Cari Hesap İlişkisi

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-043

### Açıklama
Bir müşterinin birden fazla cari hesabı olabilir. Fatura kesildiğinde hangi cari hesaba yazılacağı seçilebilir.

### Acceptance Criteria
- [ ] Müşteri detayında cari hesap listesi
- [ ] Cari hesap atama/çıkarma
- [ ] Default cari hesap belirleme
- [ ] Fatura oluşturmada cari hesap seçimi

---

## TASK-046: Gelir Kayıtları

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-038, TASK-043

### Açıklama
Fatura ödendiğinde otomatik gelir kaydı. Stok kuralı: gelir sadece fatura/hizmet üzerinden.

### Acceptance Criteria
- [ ] Income model (id, tenantId, category, amount, description, invoiceId?, paymentId?, accountId?, date)
- [ ] Fatura ödemesi → otomatik gelir kaydı
- [ ] Gelir kategorileri (hizmet, ürün satışı, diğer)
- [ ] Manuel gelir girişi YASAK (sadece fatura/ödeme üzerinden)

---

## TASK-047: Gider Kayıtları

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-043

### Açıklama
Kira, fatura, tedarik alımı, personel giderleri vb.

### Acceptance Criteria
- [ ] Expense model (id, tenantId, category, amount, description, supplierId?, accountId?, date, receiptUrl?)
- [ ] Gider kategorileri (kira, elektrik, su, malzeme alımı, personel, diğer)
- [ ] Gider CRUD endpoints
- [ ] Gider → cari hesap hareketi (tedarikçi cari)
- [ ] Aylık gider özeti

---

## TASK-048: Kasa/Banka Hesapları

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-043

### Açıklama
Nakit kasa ve banka hesapları takibi.

### Acceptance Criteria
- [ ] CashRegister model (id, tenantId, name, type[cash/bank], balance, accountNo?, bankName?)
- [ ] Kasa hareketi (giriş/çıkış) her ödeme/giderde otomatik
- [ ] Kasa transferi (kasadan bankaya vb.)
- [ ] Günlük kasa raporu

---

## TASK-049: Cari Hesap Frontend

**Agent**: frontend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-043

### Acceptance Criteria
- [ ] Cari hesap listesi (bakiye, tür filtre)
- [ ] Cari hesap detay (hareket geçmişi, ekstre)
- [ ] Cari hesap ekleme/düzenleme formu
- [ ] Müşteri detayında cari hesap widget'ı

---

## TASK-050: Gelir/Gider Frontend

**Agent**: frontend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-046, TASK-047

### Acceptance Criteria
- [ ] Gelir listesi (tarih, tutar, kaynak)
- [ ] Gider listesi (tarih, tutar, kategori)
- [ ] Gider ekleme formu
- [ ] Gelir/gider dashboard (aylık özet, grafikler)
