# Phase 6: Çalışan & Bordro (KKTC)

## TASK-051: Çalışan CRUD

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-012

### Açıklama
Çalışan yönetimi. Kişisel bilgi, pozisyon, maaş bilgisi, başlangıç tarihi.

### Acceptance Criteria
- [ ] Employee model (id, tenantId, userId?, name, phone, email, tcNo, position, department, startDate, endDate?, grossSalary, status[active/inactive/terminated])
- [ ] CRUD endpoints
- [ ] Çalışan listesi + arama
- [ ] Aktif/pasif filtreleme

---

## TASK-052: KKTC Maaş Hesaplama

**Agent**: backend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-051

### Açıklama
KKTC'ye özel brüt → net maaş hesaplama. SGK işçi/işveren payı, ihtiyat sandığı, gelir vergisi.

### Acceptance Criteria
- [ ] PayrollCalculation service:
  - Brüt maaş
  - SGK işçi payı (%X)
  - SGK işveren payı (%X)
  - İhtiyat sandığı işçi payı (%X)
  - İhtiyat sandığı işveren payı (%X)
  - Gelir vergisi matrahı
  - Gelir vergisi
  - Net maaş
- [ ] Tüm oranlar ve sabitler ayarlanabilir (TASK-053)
- [ ] Hesaplama endpoint: POST /api/v1/payroll/calculate

---

## TASK-053: Asgari Ücret & SGK Parametre Yönetimi

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-052

### Açıklama
KKTC parametreleri tenant veya global ayarlar üzerinden düzenlenebilir.

### Acceptance Criteria
- [ ] PayrollParams model (id, tenantId?, name, value, effectiveFrom, effectiveTo?)
- [ ] Default KKTC parametreleri:
  - Asgari ücret
  - SGK işçi oranı
  - SGK işveren oranı
  - İhtiyat sandığı işçi oranı
  - İhtiyat sandığı işveren oranı
  - Gelir vergisi dilimleri
- [ ] Parametre CRUD (admin tarafından düzenlenebilir)
- [ ] Tarih bazlı geçerlilik (oran değişikliklerini takip)

---

## TASK-054: Aylık Bordro Oluşturma

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-052

### Açıklama
Aylık bordro oluştur. Tüm çalışanlar için toplu veya tekli.

### Acceptance Criteria
- [ ] Payroll model (id, tenantId, employeeId, month, year, grossSalary, sgkEmployee, sgkEmployer, providentEmployee, providentEmployer, incomeTax, netSalary, status[draft/approved/paid])
- [ ] Toplu bordro oluşturma (tüm aktif çalışanlar)
- [ ] Tekli bordro oluşturma
- [ ] Bordro onaylama ve ödeme durumu
- [ ] Aylık bordro özet raporu

---

## TASK-055: Çalışan Giderleri

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-054, TASK-047

### Açıklama
Bordro ödendiğinde otomatik gider kaydı oluştur.

### Acceptance Criteria
- [ ] Bordro PAID → Expense kaydı (kategori: personel)
- [ ] SGK işveren payı ayrı gider kaydı
- [ ] İhtiyat sandığı işveren payı ayrı gider kaydı
- [ ] Aylık toplam personel gideri hesaplama

---

## TASK-056: Çalışan Frontend

**Agent**: frontend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-051

### Acceptance Criteria
- [ ] Çalışan listesi (tablo, durum filtre)
- [ ] Çalışan detay (bilgiler, bordro geçmişi)
- [ ] Çalışan ekleme/düzenleme formu
- [ ] Maaş hesaplama widget (brüt gir → net göster)

---

## TASK-057: Bordro Frontend

**Agent**: frontend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-054

### Acceptance Criteria
- [ ] Aylık bordro listesi
- [ ] Bordro oluşturma (ay seç → toplu hesapla → onayla)
- [ ] Bordro detay (çalışan bazlı kalemler)
- [ ] SGK/ihtiyat sandığı parametre ayarları sayfası
