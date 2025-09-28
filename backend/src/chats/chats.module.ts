// src/chats/chats.module.ts
import { Module } from "@nestjs/common";
import { ChatsController } from "./chats.controller";
import { ChatsService } from "./chats.service";
import { SupabaseService } from "../supabase/supabase.service";
import { FilesService } from "../files/files.service";
@Module({
  controllers: [ChatsController],
  providers: [ChatsService, SupabaseService, FilesService],
  exports: [ChatsService],
})
export class ChatsModule {}
