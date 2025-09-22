import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudentCoursesService {
  private apiUrl = 'http://localhost:3000/student-courses'; // Your NestJS backend
  //private apiUrl = 'https://studynester.onrender.com/student-courses'; // Your NestJS backend

  constructor(private http: HttpClient) {}

  // Get matches for a specific user
  getMatchingStudents(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/matches/${userId}`);
  }

  addCourse(course: { course_code: string; course_name: string }): Observable<any> {
  return this.http.post(`${this.apiUrl}/add-course`, course);
  }

addStudentCourse(studentId: string, course: { course_code: string, course_name: string }): Observable<any> {
  return this.http.post(`${this.apiUrl}/add-student-courses`, { studentId, courses: [course] });
}

  // fetch available matches
  getMatches(studentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/find/${studentId}`);
  }

  // save a match
  saveMatch(userId: string, matchedUserId: string): Observable<any> {
    // Corrected to pass string IDs
    // The backend uses a POST to /match, which is correct
    return this.http.post(`${this.apiUrl}/match`, {
      userId,
      matchedUserId
    });
  }

  // skip a student
  skipMatch(userId: string, matchedUserId: string): Observable<any> {
    // Changed to a PATCH request to the correct endpoint
    return this.http.patch(`${this.apiUrl}/match-status`, {
      userId,
      matchedUserId,
      status: 'rejected' // Set the status to 'rejected' for skipping
    });
  }
  // get already matched partners
  getMatchedPartners(userId: string): Observable<any> {
    // Corrected to match the NestJS endpoint: GET /student-courses/matched/:userId
    return this.http.get(`${this.apiUrl}/matched/${userId}`);
  }


}
