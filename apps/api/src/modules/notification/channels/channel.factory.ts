import { Injectable } from '@nestjs/common';
import { SmsChannel } from './sms.channel';
import { EmailChannel } from './email.channel';
import { WhatsAppChannel } from './whatsapp.channel';

export type ChannelType = 'sms' | 'email' | 'whatsapp';

/**
 * Factory that returns the appropriate channel service for a given type.
 * Add new channel types here as integrations are added.
 */
@Injectable()
export class ChannelFactory {
  constructor(
    private readonly smsChannel: SmsChannel,
    private readonly emailChannel: EmailChannel,
    private readonly whatsAppChannel: WhatsAppChannel,
  ) {}

  getChannel(type: ChannelType): SmsChannel | EmailChannel | WhatsAppChannel {
    switch (type) {
      case 'sms':
        return this.smsChannel;
      case 'email':
        return this.emailChannel;
      case 'whatsapp':
        return this.whatsAppChannel;
    }
  }
}
