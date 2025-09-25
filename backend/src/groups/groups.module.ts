import { Module } from "@nestjs/common";
import { SupabaseModule } from "src/supabase/supabase.module";
import { GroupsService } from "./groups.service";
import { GroupsController } from "./groups.controller";
import { SupabaseService } from "src/supabase/supabase.service";
import { NotificationsModule } from "src/notifications/notifications.module";
@Module({
  imports: [NotificationsModule],
  providers: [GroupsService, SupabaseService],
  controllers: [GroupsController],
})
export class GroupsModule {}
