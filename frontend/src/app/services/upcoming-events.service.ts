// frontend/src/app/services/upcoming-events.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

// Interface to define the structure of an event object
export interface ClubEvent {
  id: number;
  title: string;
  date: string;
  location: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class UpcomingEventsService {
  //private apiUrl = 'http://localhost:3000/events/upcoming'; //https://studynester.onrender.com/
  private apiUrl = ' //https://studynester.onrender.com/events/upcoming';

  constructor(private http: HttpClient) { }

  getStudyEvents(): Observable<ClubEvent[]> {
    return this.http.get<ClubEvent[]>(this.apiUrl).pipe(
      // Add the .pipe() and map() operators to filter the results
      map(events => 
        // The filter keeps only the events that match our criteria
        events.filter(event =>
          event.title.toLowerCase().includes('tech') ||
          event.title.toLowerCase().includes('ai') ||
          event.title.toLowerCase().includes('workshop') ||
          event.title.toLowerCase().includes('study') ||
          event.title.toLowerCase().includes('CSAM') ||
          event.description.toLowerCase().includes('study')
        )
      )
    );
  }
}