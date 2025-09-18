import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface _Notifications
{
  id: string,
  user_id:string,
  message :string;
  read:boolean;
}
@Injectable({
  providedIn: 'root'
})
export class Notifications {
  //private baseUrl ='https://studynester.onrender.com/notifications'
  private baseUrl ='http://localhost:3000/notifications'
  constructor(private http:HttpClient){}


  getNotifications()
  {
    return this.http.get<_Notifications[]>(this.baseUrl);
  }

   getNotificationsByUser(uid:string) : Observable<any>
  {
    return this.http.get(`${this.baseUrl}/${uid}`);
  }
  markAsRead(notificationId:string) : Observable<any>
  {
      return this.http.patch(`${this.baseUrl}/${notificationId}`, {
      read: true
    });
  }

  clearNotifications(userId:string)
  {
    return this.http.delete(`${this.baseUrl}/${userId}`);
  }

}
