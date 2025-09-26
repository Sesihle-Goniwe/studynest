import { Module } from "@nestjs/common";
import { MailerService } from "./mailer.service";
import { SupabaseModule } from "src/supabase/supabase.module";
@Module({
  imports: [SupabaseModule],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
