import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
    imports: [SupabaseModule],
    providers: [SessionsService],
    controllers: [SessionsController],

})
export class SessionsModule {}
