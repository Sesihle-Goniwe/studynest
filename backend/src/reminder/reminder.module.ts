import { Module } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [SupabaseModule, MailerModule],
  providers: [ReminderService],
  exports: [ReminderService],
})
export class ReminderModule {}

