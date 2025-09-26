import { Injectable, HttpException } from '@nestjs/common';
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
 .single(); // ensure only one row returned
 
 if (error) {
 console.error('Supabase insert error:', error);
 return { success: false, message: null, error };
 }
 
 return { success: true, message: data };
 }

 
 
async getGroupMessages(groupId: string) {
    if (!groupId) return { success: false, messages: [] };

    // Fetch messages along with user metadata
    const { data, error } = await this.supabaseSer.getClient()
      .from('group_chats')
      .select(`
        *,
        user:user_id (
          id,
          raw_user_meta_data
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase select error:', error);
      return { success: false, messages: [], error };
    }

    // Map messages to include senderName for frontend
    const messages = data.map((msg: any) => ({
      id: msg.id,
      groupId: msg.group_id,
      userId: msg.user_id,
      message: msg.message,
      createdAt: msg.created_at,
      senderName: msg.user?.raw_user_meta_data?.full_name 
                  || msg.user?.raw_user_meta_data?.name 
                  || 'Anonymous'
    }));

    return { success: true, messages };
  }

 async editMessage(messageId: string, userId: string, newText: string) {
  if (!messageId || !userId || !newText) return { success: false };

  // Check message exists and belongs to user
  const { data: existing, error: fetchError } = await this.supabaseSer.getClient()
    .from('group_chats')
    .select('*')
    .eq('id', messageId)
    .single();

  if (fetchError || !existing || existing.user_id !== userId) return { success: false };

  // Check 5 minutes limit
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

  // Check 5 minutes limit
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