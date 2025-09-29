/* --- 
  FRONTEND: src/app/services/notes-api.service.ts
--- */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class NotesApiService {
  //private backendUrl = 'http://localhost:3000/files';
  private backendUrl = 'https://studynester.onrender.com/files';

  constructor(private http: HttpClient) { }

  // 1. Update the method to accept userId
  uploadNote(file: File, userId: string): Observable<any> {
    const formData = new FormData();
    // 2. Append both the file and the userId to the form data
    formData.append('file', file, file.name);
    formData.append('userId', userId); // <-- This is the key change

    return this.http.post<any>(`${this.backendUrl}/upload`, formData);
  }
   getPersonalNoteUrl(fileId: string, userId: string): Observable<{ signedUrl: string }> {
    // Add the userId as a query parameter
    return this.http.get<{ signedUrl: string }>(`${this.backendUrl}/personal/${fileId}/url`, { params: { userId } });
  }
  getGroupNoteUrl(fileId: string, userId: string): Observable<{ signedUrl: string }> {
    // Add the userId as a query parameter
    return this.http.get<{ signedUrl: string }>(`${this.backendUrl}/group/${fileId}/url`, { params: { userId } });
  }
getSummary(fileId: string, userId: string): Observable<{ summary: string }> {
    return this.http.post<{ summary: string }>(
      `${this.backendUrl}/${fileId}/summarize`,
      { userId } // Pass userId in the body
    );
  }

}
