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


}
