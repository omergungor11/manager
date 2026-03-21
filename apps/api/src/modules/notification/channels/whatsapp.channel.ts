import { Injectable, Logger } from '@nestjs/common';

/**
 * WhatsApp channel placeholder.
 * Real implementation will use WhatsApp Business API by swapping this service.
 */
@Injectable()
export class WhatsAppChannel {
  private readonly logger = new Logger(WhatsAppChannel.name);

  /**
   * Send a WhatsApp message to the given phone number.
   * Currently logs to console and returns success.
   * Replace the body of this method with a WhatsApp Business API call.
   */
  async send(phone: string, message: string): Promise<{ success: boolean }> {
    this.logger.log(`[WhatsApp] To: ${phone} | Message: ${message}`);
    // TODO: integrate WhatsApp Business API
    // await whatsappClient.sendMessage({ to: phone, body: message });
    return { success: true };
  }
}
