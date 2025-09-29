import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface _Session
{
  id: string;
  group_id:string;
  title:string;
  description? : string;
  start_time?: string;
  end_time?: string;
  location?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Sessions {
 private baseUrl ='https://studynester.onrender.com/sessions';
  //private baseUrl= "http://localhost:3000/sessions"

  constructor (private http: HttpClient){}

  createSession(sessions:any): Observable<any>
  {
    return this.http.post(`${this.baseUrl}/create`, sessions);

  }

getSessionbyGroupID(groupId: string): Observable<_Session[]> {
  return this.http.get<_Session[]>(`${this.baseUrl}/${groupId}`);
}

 deleteSession(sessionId:string)
  {
      return this.http.delete(`${this.baseUrl}/${sessionId}`);
  }
  leaveGroup(groupId:string,uid:string): Observable<any>
  {
    return this.http.delete(`${this.baseUrl}/${groupId}/${uid}`);
  }

  getUserRole(groupId:string,userId:string): Observable<any>
  {
    return this.http.get(`${this.baseUrl}/${groupId}/${userId}`);
  }
}
