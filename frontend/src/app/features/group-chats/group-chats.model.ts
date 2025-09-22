export interface GroupMessage {
  id?: string;
  group_id: string;
  user_id: string;
  username?: string;   // <-- add this
  message: string;
  created_at?: string;
}
