export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_color: string;
  bio?: string;
  is_online?: boolean;
  last_seen?: string;
}

export interface Chat {
  id: string;
  type: "private" | "group";
  name?: string;
  display_name: string;
  display_color: string;
  description?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  partner_online?: boolean;
  partner_id?: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  sender_color: string;
  sender_username: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const STORAGE_KEY = "messenger_user";

export function saveUser(user: User) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function loadUser(): User | null {
  const s = localStorage.getItem(STORAGE_KEY);
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

export function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
}
