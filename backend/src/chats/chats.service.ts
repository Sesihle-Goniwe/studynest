import { Injectable, HttpException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ChatsService {
  constructor(private readonly supabaseSer: SupabaseService) {}

  async sendMessage(text: string, groupId: string, userId: string) {
    if (!text || !groupId || !userId) {
      return { success: false, message: null };
    }

    const { data, error } = await this.supabaseSer.getClient()
      .from('group_chats')
      .insert([{ message: text, group_id: groupId, user_id: userId }])
      .select()
      .single(); // ensure only one row returned

    if (error) {
      console.error('Supabase insert error:', error);
      return { success: false, message: null, error };
    }

    return { success: true, message: data };
  }

  async getGroupMessages(groupId: string) {
    if (!groupId) return { success: false, messages: [] };

    const { data, error } = await this.supabaseSer.getClient()
      .from('group_chats')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase select error:', error);
      return { success: false, messages: [], error };
    }

    return { success: true, messages: data };
  }
}
