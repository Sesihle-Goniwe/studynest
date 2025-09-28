import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface FileData {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}
export interface GroupMessage {
  id: string;
  groupId: string;
  userId: string;
  message: string;
  messageType: 'text' | 'file';
  createdAt: string;
  fileId?: string;
  fileData?: FileData;
  fullName?: string; // optional, will be resolved from Students service
  
}

@Injectable({
  providedIn: 'root'
})
export class GroupChatsService {
  private baseUrl ='https://studynester.onrender.com/chats';
  //private baseUrl ='http://localhost:3000/chats';



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
 //main upload method 
  uploadFileToChat(file: File, userId: string, groupId: string, message?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('userId', userId);
    formData.append('groupId', groupId);
    if (message) {
      formData.append('message', message);
    }

    return this.http.post<any>(`${this.baseUrl}/upload`, formData).pipe(
      catchError(err => {
        console.error('Error uploading file to chat:', err);
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
