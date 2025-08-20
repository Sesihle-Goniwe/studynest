// src/files/files.module.ts

import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { SupabaseModule } from '../supabase/supabase.module'; // <-- Import it

@Module({
  imports: [
    SupabaseModule, // <-- Add it here
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}