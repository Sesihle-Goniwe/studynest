// src/app/services/progress-api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProgressApiService {
  //private apiUrl = 'http://localhost:3000/progress';
  private apiUrl = 'https://studynester.onrender.com/files';

  constructor(private http: HttpClient) { }

  // This method will require an Auth Interceptor to add the JWT
  getTopics(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/topics`, { params: { userId } });
  }

  // This method will also require the Auth Interceptor
  createTopic(topicData: { name: string, file_id?: string, userId: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/topics`, topicData);
  }
  getStudyLogs(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/study-logs`, { params: { userId } });
  }

  addStudyLog(userId: string, topicId: string, date: string, hours: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/study-logs`, { userId, topicId, date, hours });
  }
  updateTopicStatus(topicId: string, status: string): Observable<any> {
      const url = `${this.apiUrl}/topics/${topicId}`;
      return this.http.patch(url, { status }); // Send the new status in the body
    }

  deleteTopic(topicId: string): Observable<any> {
    const url = `${this.apiUrl}/topics/${topicId}`;
    return this.http.delete(url);
  }
}