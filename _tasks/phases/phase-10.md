# Phase 10: Frontend & PWA

## TASK-077: PWA Setup

**Agent**: frontend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-009

### Açıklama
Progressive Web App: service worker, manifest, offline cache. Online-first ama offline'da da temel işlemler çalışmalı.

### Acceptance Criteria
- [ ] next-pwa veya workbox entegrasyonu
- [ ] Web app manifest (name, icons, theme color, display: standalone)
- [ ] Service worker: cache-first strateji (static assets), network-first (API calls)
- [ ] Install prompt (A2HS)
- [ ] Offline fallback sayfası

---

## TASK-078: Offline-First Data Sync

**Agent**: frontend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-077

### Açıklama
IndexedDB ile local data cache. Offline'da yapılan işlemler queue'lanır, online olunca sync edilir.

### Acceptance Criteria
- [ ] IndexedDB setup (Dexie.js veya idb)
- [ ] Kritik data local cache (müşteriler, araçlar, ürünler, hizmetler)
- [ ] Offline queue: offline'da yapılan CRUD işlemleri queue'lanır
- [ ] Online olunca: queue replay + conflict resolution
- [ ] Sync durumu göstergesi (UI'da)

---

## TASK-079: Keyboard Shortcuts

**Agent**: frontend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-009

### Açıklama
Hızlı kullanım için kısayollar. Sık yapılan işlemlere hızlı erişim.

### Acceptance Criteria
- [ ] Global shortcut handler (hotkeys library)
- [ ] Default kısayollar:
  - F2 / Ctrl+N: Yeni iş emri
  - F3 / Ctrl+F: Plaka arama
  - F4: Yeni müşteri
  - Ctrl+P: Fatura yazdır
  - Ctrl+S: Kaydet
  - Esc: Modal/panel kapat
- [ ] Kısayol referans paneli (? tuşu)
- [ ] Ayarlardan özelleştirme (opsiyonel)

---

## TASK-080: Detaylı Ayarlar Sayfası

**Agent**: frontend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-063

### Açıklama
Tenant bazlı tüm ayarlar tek sayfada. Sekmeli yapı.

### Acceptance Criteria
- [ ] Genel ayarlar (işletme adı, logo, iletişim, vergi no)
- [ ] Fatura ayarları (numara formatı, varsayılan vergi oranı, fatura şablonu)
- [ ] Hizmet ayarları (hatırlatma kuralları, default hatırlatma süresi)
- [ ] Bildirim ayarları (SMS gateway, email SMTP, WhatsApp)
- [ ] Çalışan/bordro ayarları (KKTC parametreleri, SGK oranları)
- [ ] Kullanıcı & rol yönetimi
- [ ] Stok ayarları (düşük stok eşiği, stok yetersiz davranışı)

---

## TASK-081: Local Yedekleme

**Agent**: frontend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-078

### Acceptance Criteria
- [ ] IndexedDB verilerini JSON export
- [ ] JSON import (geri yükleme)
- [ ] Otomatik local backup (her X saatte bir)
- [ ] Backup geçmişi listesi
- [ ] Son backup zamanı göstergesi

---

## TASK-082: Responsive Mobile Optimization

**Agent**: frontend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-077

### Acceptance Criteria
- [ ] Mobile-first responsive layout
- [ ] Touch-friendly büyük butonlar ve hedefler
- [ ] Mobile navigation (bottom tab bar)
- [ ] Swipe gesture'lar (opsiyonel)
- [ ] Tablet optimizasyon (split-view)
