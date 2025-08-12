
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface _Student {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

@Injectable (
  {
    providedIn:'root'
  }
)
export class Students {
  private baseUrl = 'http://localhost:3000/students';

  constructor(private http: HttpClient){}

  getStudents()
  {
    return this.http.get<_Student[]>(this.baseUrl);
  }
}
