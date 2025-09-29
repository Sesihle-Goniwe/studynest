// backend/src/events/events.controller.ts

import { Controller, Get } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events') // This means all routes in this controller start with /events
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('upcoming') // This creates the final route: GET /events/upcoming
  getUpcomingEvents() {
    return this.eventsService.getUpcomingEvents();
  }
}