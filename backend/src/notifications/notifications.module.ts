import { Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { SupabaseModule } from "../supabase/supabase.module";
import { MailerModule } from "src/mailer/mailer.module";
@Module({
  imports: [SupabaseModule, MailerModule],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
