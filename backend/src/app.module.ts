import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { StudentsModule } from './students/students.module';
import { FilesModule } from './files/files.module';
import { MulterModule } from '@nestjs/platform-express';
import { GroupsModule } from './groups/groups.module';
import { SessionsModule } from './sessions/sessions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MailerModule } from './mailer/mailer.module';
import { ProgressModule } from './progress/progress.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule, 
    StudentsModule, 
    NotificationsModule,
    SessionsModule,
    GroupsModule,
    FilesModule,
    MailerModule,
    ProgressModule,
    MulterModule.register({
      dest: './uploads', // Optional: specify a destination for temporary files
    }),
  ],
  controllers: [AppController],
  providers: [AppService ],
})
export class AppModule {}
