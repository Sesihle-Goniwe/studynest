import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';


export interface GroupMessage {
  id: string;
  groupId: string;
  userId: string;
  message: string;
  createdAt: string;
  fullName?: string; // optional, will be resolved from Students service
}

@Injectable({
  providedIn: 'root'
})
export class GroupChatsService {
  private baseUrl ='https://studynester.onrender.com/chats';

  constructor(private http: HttpClient) {}

  sendMessage(groupId: string, userId: string, message: string) {
    return this.http.post<{ success: boolean; message: GroupMessage }>(
      `${this.baseUrl}/send`,
      { text: message, groupId, userId }
    ).pipe(
      catchError(err => {
        console.error('Error sending message:', err);
        return throwError(() => err);
      })
    );
  }

  getMessages(groupId: string): Observable<{ success: boolean; messages: GroupMessage[] }> {
    return this.http.get<{ success: boolean; messages: GroupMessage[] }>(
      `${this.baseUrl}/group/${groupId}`
    ).pipe(
      catchError(err => {
        console.error('Error loading messages:', err);
        return throwError(() => err);
      })
    );
  }

  editMessage(messageId: string, userId: string, newText: string) {
    return this.http.patch<{ success: boolean; message?: GroupMessage }>(
      `${this.baseUrl}/edit/${messageId}`,
      { userId, text: newText }
    );
  }

  deleteMessage(messageId: string, userId: string) {
    return this.http.delete<{ success: boolean }>(
      `${this.baseUrl}/delete/${messageId}?userId=${userId}`
    );
  }
}
