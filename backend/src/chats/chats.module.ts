// src/chats/chats.module.ts
import { Module } from '@nestjs/common';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { SupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [ChatsController],
  providers: [ChatsService, SupabaseService],
  exports: [ChatsService],
})
export class ChatsModule {}


