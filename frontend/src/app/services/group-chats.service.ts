import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface GroupMessage {
  id?: string;
  group_id: string;
  user_id: string | null;
  message: string;
  created_at?: string;
  displayName?: string; // <-- added for display
}

@Injectable({
  providedIn: 'root'
})
export class GroupChatsService {
  private baseUrl = 'https://studynester.onrender.com/chats';

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
    );
  }
}
