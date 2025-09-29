import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, PostgrestResponse } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { StudyGroup } from '../models/study-group.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface GroupMembeR
{
  group_id: string;
  role: 'admin' | 'member';
  study_groups: StudyGroup | StudyGroup[];
}

interface GroupsWithRole
{
  group_id:string,
  role: 'admin' | 'member';

}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
 baseUrl ='https://studynester.onrender.com/groups'; 
//private baseUrl ='http://localhost:3000/groups'

  constructor(private http: HttpClient){}

 getAllGroups(): Observable<StudyGroup[]> 
 {
    return this.http.get<StudyGroup[]>(this.baseUrl);
  }

  getMyGroups(userId: string): Observable<any[]> 
  {
      return this.http.get<any[]>(`${this.baseUrl}/${userId}`);
  }


  createGroup(name: string, description: string, userId: string): Observable<StudyGroup[]> 
  {
    console.log("user loging front",userId);
    return this.http.post<StudyGroup[]>(`${this.baseUrl}/create`, {
      name,
      description,
      userId
    });
  }

 

    joinGroup(groupId: string, userId: string, role: 'admin' | 'member' = 'member'): Observable<any> {
    return this.http.post(`${this.baseUrl}/join`, {
      groupId,
      userId,
      role
    });
  }
  
  deleteGroup(userId:string)
  {
     return this.http.delete(`${this.baseUrl}/${userId}`);
  }

  updateGroup(groupId:string,name:string,description:string){
      return this.http.patch(`${this.baseUrl}/${groupId}`, {
        name: name,
      description: description
  });
  }

  setGroupGoal(groupId: string, title: string, createdBy: string) {
  return this.http.post(`${this.baseUrl}/set`, {
    groupId,
    title,
    createdBy
  });
}

getGroupGoals(groupId: string) {
  return this.http.get<any[]>(`${this.baseUrl}/goals/${groupId}`);
}

}
