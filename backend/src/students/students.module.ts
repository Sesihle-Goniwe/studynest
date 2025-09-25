// src/students/students.module.ts
import { Module } from "@nestjs/common";
import { StudentsService } from "./students.service";
import { StudentsController } from "./students.controller";
import { SupabaseModule } from "../supabase/supabase.module";

@Module({
  imports: [SupabaseModule],
  providers: [StudentsService],
  controllers: [StudentsController],
})
export class StudentsModule {}
