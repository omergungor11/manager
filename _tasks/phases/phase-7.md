# Phase 7: Bildirimler & Hatırlatmalar

## TASK-058: Notification Altyapısı

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-012

### Açıklama
BullMQ ile notification queue sistemi. SMS, email, WhatsApp kanallarına tek altyapı.

### Acceptance Criteria
- [ ] NotificationQueue (BullMQ + Redis)
- [ ] Notification model (id, tenantId, type[sms/email/whatsapp], recipientId, channel, content, status[queued/sent/failed], sentAt, error?)
- [ ] NotificationTemplate model (id, tenantId, name, channel, subject?, body, variables[])
- [ ] Queue processor (kanal bazlı dispatch)
- [ ] Retry logic (3 deneme, exponential backoff)

---

## TASK-059: SMS Gateway Entegrasyonu

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-058

### Acceptance Criteria
- [ ] SMS provider adapter (configurable per tenant)
- [ ] SMS gönderim servisi
- [ ] Tenant ayarlarında SMS gateway config (API key, sender ID)
- [ ] SMS delivery status tracking

---

## TASK-060: Email Gönderim Servisi

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-058

### Acceptance Criteria
- [ ] Nodemailer + SMTP config
- [ ] Email template renderer (Handlebars/React Email)
- [ ] Tenant bazlı SMTP ayarları
- [ ] Email gönderim + delivery tracking

---

## TASK-061: WhatsApp Business API

**Agent**: backend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-058

### Acceptance Criteria
- [ ] WhatsApp Business API adapter
- [ ] Mesaj gönderim servisi
- [ ] Template mesajlar (onaylı WhatsApp templates)
- [ ] Tenant bazlı WhatsApp config
- [ ] Webhook ile delivery/read status

---

## TASK-062: Servis Hatırlatma Motoru

**Agent**: backend
**Complexity**: L
**Status**: BLOCKED
**Dependencies**: TASK-058, TASK-036

### Açıklama
İş emri tamamlandığında, X gün sonra müşteriye hatırlatma gönder. "Yağ bakımınızın üzerinden 90 gün geçti" gibi.

### Acceptance Criteria
- [ ] Reminder model (id, tenantId, workOrderId, customerId, vehicleId, reminderDate, type[service_due/km_due/custom], status[pending/sent/cancelled], channel[sms/email/whatsapp])
- [ ] İş emri COMPLETED → hatırlatma otomatik oluştur (tenant ayarlarına göre)
- [ ] Cron job: her gün pending reminder'ları kontrol et, tarihi gelen hatırlatmaları gönder
- [ ] Hizmet bazlı hatırlatma kuralı (yağ değişimi: 90 gün, filtre: 180 gün vb.)
- [ ] Km bazlı hatırlatma desteği (opsiyonel, müşteri km bildirimde bulunursa)

---

## TASK-063: Hatırlatma Kuralları Yönetimi

**Agent**: backend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-062

### Acceptance Criteria
- [ ] ReminderRule model (id, tenantId, serviceDefinitionId?, name, daysAfter, kmAfter?, channel, messageTemplate, isActive)
- [ ] Default kurallar (tenant oluşturulunca)
- [ ] Tenant ayarlarından kural CRUD
- [ ] Kural override: hizmet bazlı özel kurallar

---

## TASK-064: Bildirim Frontend & Ayarları

**Agent**: frontend
**Complexity**: M
**Status**: BLOCKED
**Dependencies**: TASK-058

### Acceptance Criteria
- [ ] Bildirim geçmişi listesi (gönderilen, başarısız)
- [ ] Hatırlatma kuralları yönetim sayfası
- [ ] SMS/Email/WhatsApp gateway ayarları
- [ ] Bildirim template düzenleme
