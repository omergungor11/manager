import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { ReminderService } from './reminder.service';
import { ReminderController } from './reminder.controller';
import { ChannelFactory } from './channels/channel.factory';
import { SmsChannel } from './channels/sms.channel';
import { EmailChannel } from './channels/email.channel';
import { WhatsAppChannel } from './channels/whatsapp.channel';

@Module({
  controllers: [NotificationController, ReminderController],
  providers: [
    // Channel adapters
    SmsChannel,
    EmailChannel,
    WhatsAppChannel,
    ChannelFactory,
    // Core services
    NotificationService,
    ReminderService,
  ],
  exports: [NotificationService, ReminderService],
})
export class NotificationModule {}
