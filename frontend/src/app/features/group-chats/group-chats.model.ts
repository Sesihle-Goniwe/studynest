export interface GroupMessage {
  id?: string;
  group_id: string;
  user_id: string | null;
  message: string;
  created_at?: string;
  displayName?: string;
}
