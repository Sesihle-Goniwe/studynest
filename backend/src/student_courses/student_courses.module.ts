import { Module } from "@nestjs/common";
import { StudentCoursesService } from "./student_courses.service";
import { StudentCoursesController } from "./student_courses.controller";
import { SupabaseService } from "../supabase/supabase.service";

@Module({
  providers: [StudentCoursesService, SupabaseService],
  controllers: [StudentCoursesController],
})
export class StudentCoursesModule {}
