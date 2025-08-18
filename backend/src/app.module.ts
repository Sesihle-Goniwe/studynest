import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { StudentsModule } from './students/students.module';
import { StudentCoursesModule } from './student_courses/student_courses.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule, StudentsModule, StudentCoursesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
