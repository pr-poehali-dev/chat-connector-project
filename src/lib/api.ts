const API_URL = "/messenger";

export async function apiCall(path: string, method = "GET", body?: unknown) {
  const url = `${API_URL}${path}`;
  const opts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API error");
  return data;
}

export const api = {
  register: (username: string, display_name: string) =>
    apiCall("/register", "POST", { username, display_name }),

  login: (username: string) =>
    apiCall("/login", "POST", { username }),

  logout: (user_id: string) =>
    apiCall("/logout", "POST", { user_id }),

  getUsers: (current_user_id: string, q?: string) =>
    apiCall(`/users?current_user_id=${current_user_id}${q ? `&q=${encodeURIComponent(q)}` : ""}`),

  getChats: (user_id: string) =>
    apiCall(`/chats?user_id=${user_id}`),

  createPrivateChat: (user_id: string, partner_id: string) =>
    apiCall("/chats", "POST", { user_id, partner_id }),

  createGroupChat: (user_id: string, name: string, member_ids: string[]) =>
    apiCall("/chats", "POST", { user_id, type: "group", name, member_ids }),

  getMessages: (chat_id: string, user_id: string, before?: string) =>
    apiCall(`/messages?chat_id=${chat_id}&user_id=${user_id}${before ? `&before=${before}` : ""}`),

  sendMessage: (chat_id: string, sender_id: string, content: string) =>
    apiCall("/messages", "POST", { chat_id, sender_id, content }),

  poll: (chat_id: string, after: string, user_id: string) =>
    apiCall(`/poll?chat_id=${chat_id}&after=${encodeURIComponent(after)}&user_id=${user_id}`),

  chatUpdates: (user_id: string, after: string) =>
    apiCall(`/chat_updates?user_id=${user_id}&after=${encodeURIComponent(after)}`),
};