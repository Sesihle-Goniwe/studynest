import { Controller, Get } from '@nestjs/common';
import { EventsService } from './events.service';
import { Public } from '../decorators/public.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Get('upcoming')
  getUpcomingEvents() {
    return this.eventsService.getUpcomingEvents();
  }
}
