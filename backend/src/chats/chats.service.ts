import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ChatsService {
  constructor(private readonly supabaseSer: SupabaseService) {}

  /** Send a message to a group */
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

  /** Retrieve all messages for a group with user names */
  async getGroupMessages(groupId: string) {
    if (!groupId) return { success: false, messages: [] };

    // 1️⃣ Get messages
    const { data: messages, error: messagesError } = await this.supabaseSer.getClient()
      .from('group_chats')
      .select('id, group_id, user_id, message, created_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Supabase fetch messages error:', messagesError);
      return { success: false, messages: [], error: messagesError };
    }

    // 2️⃣ Get all users for these messages
    const userIds = messages.map((msg: any) => msg.user_id).filter(Boolean);
    const { data: users } = await this.supabaseSer.getClient()
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .in('id', userIds);

    // 3️⃣ Optionally get students table info
    const { data: students } = await this.supabaseSer.getClient()
      .from('students')
      .select('user_id, full_name')
      .in('user_id', userIds);

    // 4️⃣ Map each message to include a displayName
    const messagesWithNames = messages.map((msg: any) => {
      const user = users?.find(u => u.id === msg.user_id);
      const student = students?.find(s => s.user_id === msg.user_id);

      const displayName =
        student?.full_name ||
        user?.raw_user_meta_data?.full_name ||
        user?.raw_user_meta_data?.name ||
        user?.email ||
        'Anonymous';

      return { ...msg, displayName };
    });

    return { success: true, messages: messagesWithNames };
  }
}
