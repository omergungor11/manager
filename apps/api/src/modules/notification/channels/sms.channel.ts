import { Injectable, Logger } from '@nestjs/common';

/**
 * SMS channel placeholder.
 * Real implementation will use Twilio or Nexmo by swapping this service.
 */
@Injectable()
export class SmsChannel {
  private readonly logger = new Logger(SmsChannel.name);

  /**
   * Send an SMS message to the given phone number.
   * Currently logs to console and returns success.
   * Replace the body of this method with a Twilio/Nexmo SDK call.
   */
  async send(phone: string, message: string): Promise<{ success: boolean }> {
    this.logger.log(`[SMS] To: ${phone} | Message: ${message}`);
    // TODO: integrate Twilio/Nexmo
    // await twilioClient.messages.create({ to: phone, from: process.env.TWILIO_FROM, body: message });
    return { success: true };
  }
}
