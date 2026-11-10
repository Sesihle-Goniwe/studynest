import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface _Student {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  created_at: string;
  university: string;
  course: string;
  year: string;
  profileImage: string;
}

@Injectable({
  providedIn: 'root'
})
export class Students {
  private baseUrl = `${environment.apiBaseUrl}/students`;

  constructor(private http: HttpClient) {}

  getStudents() {
    return this.http.get<_Student[]>(this.baseUrl);
  }

  getStudentByUid(uid: string) {
    return this.http.get<_Student>(`${this.baseUrl}/${uid}`);
  }

  getMyProfile() {
    return this.http.get<_Student>(`${this.baseUrl}/me`);
  }

  updatestudentbyUid(uid: string, updateDto: any) {
    return this.http.put<_Student>(`${this.baseUrl}/${uid}`, updateDto);
  }

  updatestudentPhoto(uid: string, formData: FormData) {
    return this.http.put<_Student>(`${this.baseUrl}/${uid}/photo`, formData);
  }
}
