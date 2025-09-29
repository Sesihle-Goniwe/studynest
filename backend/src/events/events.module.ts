// backend/src/events/events.module.ts

import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { HttpModule } from '@nestjs/axios'; // 👈 Import HttpModule

@Module({
  imports: [HttpModule], // 👈 Add HttpModule here
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}