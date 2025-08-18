import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, PostgrestResponse } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { StudyGroup } from '../models/study-group.model';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async createGroup(name: string, description: string, userId: string): Promise<PostgrestResponse<StudyGroup>> {
    return this.supabase
      .from('study_groups')
      .insert([{ name, description, created_by: userId }])
      .select();
  }

  async getAllGroups(): Promise<PostgrestResponse<StudyGroup>> {
    return this.supabase.from('study_groups').select('*');
   }


  async joinGroup(
    groupId: string,
    userId: string,
    role: 'admin' | 'member' = 'member'
  ): Promise<PostgrestResponse<{ id: string; group_id: string; user_id: string; role: string }>> {
    return this.supabase
      .from('group_members')
      .insert([{ group_id: groupId, user_id: userId, role }])
      .select();
  }

  async getMyGroups(userId: string): Promise<
    PostgrestResponse<{ group_id: string; role: 'admin' | 'member'; study_groups: StudyGroup[] }>
  > {
    return this.supabase
      .from('group_members')
      .select('group_id, role, study_groups(*)')
      .eq('user_id', userId);
  }
}