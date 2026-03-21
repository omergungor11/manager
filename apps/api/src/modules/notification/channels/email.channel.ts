import { Injectable, Logger } from '@nestjs/common';

/**
 * Email channel placeholder.
 * Real implementation will use nodemailer or SendGrid by swapping this service.
 */
@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);

  /**
   * Send an email to the given address.
   * Currently logs to console and returns success.
   * Replace the body of this method with a nodemailer/SendGrid call.
   */
  async send(
    to: string,
    subject: string,
    body: string,
  ): Promise<{ success: boolean }> {
    this.logger.log(`[Email] To: ${to} | Subject: ${subject} | Body: ${body}`);
    // TODO: integrate nodemailer or SendGrid
    // await transporter.sendMail({ to, subject, html: body });
    return { success: true };
  }
}
