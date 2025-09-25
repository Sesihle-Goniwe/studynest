import { Module } from "@nestjs/common";
import { SessionsController } from "./sessions.controller";
import { SessionsService } from "./sessions.service";
import { SupabaseModule } from "src/supabase/supabase.module";
import { MailerModule } from "src/mailer/mailer.module";
import { ReminderService } from "../reminder/reminder.service";
@Module({
  imports: [SupabaseModule, MailerModule],
  providers: [SessionsService, ReminderService],
  controllers: [SessionsController],
})
export class SessionsModule {}
