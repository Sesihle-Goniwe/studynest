import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ChatsService {
  constructor(private supabaseSer: SupabaseService) {}

  async sendMessage(text: string, groupId: string, userId: string) {
    if (!text || !groupId || !userId) {
      return { success: false, message: null };
    }

    const { data, error } = await this.supabaseSer.getClient()
      .from('group_chats')
      .insert([{ message: text, group_id: groupId, user_id: userId }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return { success: false, message: null, error };
    }

    return { success: true, message: data };
  }

  async getGroupMessages(groupId: string) {
  if (!groupId) return { success: false, messages: [] };

  try {
    const { data, error } = await this.supabaseSer.getClient()
      .from('group_chats')
      .select(`
        id,
        group_id,
        user_id,
        message,
        created_at,
        user: user_id (
          email,
          raw_user_meta_data
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const messagesWithName = data.map((msg: any) => ({
      ...msg,
      displayName:
        msg.user?.raw_user_meta_data?.full_name ||
        msg.user?.email ||
        'Anonymous',
    }));

    return { success: true, messages: messagesWithName };
  } catch (err) {
    console.error('Error fetching group messages:', err);
    return { success: false, messages: [], error: err };
  }
}


  async editMessage(messageId: string, userId: string, newText: string) {
    if (!messageId || !userId || !newText) return { success: false };

    const { data: existing, error: fetchError } = await this.supabaseSer.getClient()
      .from('group_chats')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError || !existing || existing.user_id !== userId) return { success: false };

    const createdAt = new Date(existing.created_at).getTime();
    if (Date.now() - createdAt > 5 * 60 * 1000) return { success: false };

    const { data, error } = await this.supabaseSer.getClient()
      .from('group_chats')
      .update({ message: newText })
      .eq('id', messageId)
      .select()
      .single();

    if (error) return { success: false };

    return { success: true, message: data };
  }

  async deleteMessage(messageId: string, userId: string) {
    if (!messageId || !userId) return { success: false };

    const { data: existing, error: fetchError } = await this.supabaseSer.getClient()
      .from('group_chats')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError || !existing || existing.user_id !== userId) return { success: false };

    const createdAt = new Date(existing.created_at).getTime();
    if (Date.now() - createdAt > 5 * 60 * 1000) return { success: false };

    const { error } = await this.supabaseSer.getClient()
      .from('group_chats')
      .delete()
      .eq('id', messageId);

    if (error) return { success: false };

    return { success: true };
  }
}
