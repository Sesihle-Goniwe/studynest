export interface GroupMessage {
  id: string;
  groupId: string;
  userId: string | null;
  message: string;
  createdAt: string;
  displayName?: string; // username or "Anonymous"
}

