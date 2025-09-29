// backend/src/events/events.service.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EventsService {
  constructor(private readonly httpService: HttpService) {}

  async getUpcomingEvents() {
    const externalApiUrl = 'https://clubs-connect-api.onrender.com/api/events';

    try {
      // Make the HTTP GET request from your server to their server
      const response = await firstValueFrom(
        this.httpService.get(externalApiUrl),
      );
      // Return the data received from their API
      return response.data;
    } catch (error) {
      console.error('Error fetching events from external API:', error.message);
      throw new InternalServerErrorException('Failed to fetch upcoming events.');
    }
  }
}