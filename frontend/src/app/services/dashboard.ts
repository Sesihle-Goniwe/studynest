import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { _Student } from '../services/students';


@Injectable({
  providedIn: 'root'
})
export class Dashboard {
   //private baseUrl ='https://studynester.onrender.com/students';
  private baseUrl ='http://localhost:3000/students'
  constructor(private http: HttpClient){}


  updateUserName(uid:string, userName:string) 
  {
      return this.http.put<_Student>(`${this.baseUrl}/${uid}`, {
      full_name:userName
    });
  }
}
