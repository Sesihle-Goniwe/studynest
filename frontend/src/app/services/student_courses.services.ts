import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudentCoursesService {
  private apiUrl = 'http://localhost:3000/student-courses'; // Your NestJS backend

  constructor(private http: HttpClient) {}

  // Get matches for a specific user
  getMatchingStudents(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/matches/${userId}`);
  }

  // Optional: Send match decision (yes/no)
  sendMatchDecision(userId: string, targetId: string, isMatch: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/decision`, {
      userId,
      targetId,
      match: isMatch
    });
  }

}
