import { useState } from "react";
import type { Chat, User } from "@/lib/store";
import Avatar from "./Avatar";

interface Props {
  currentUser: User;
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chat: Chat) => void;
  onNewChat: () => void;
  onLogout: () => void;
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`;
  if (diff < 86400) {
    return date.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("ru", { day: "numeric", month: "short" });
}

export default function ChatList({ currentUser, chats, selectedChatId, onSelectChat, onNewChat, onLogout }: Props) {
  const [search, setSearch] = useState("");

  const filtered = chats.filter((c) =>
    c.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full" style={{ background: "#17212b" }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#0d1621" }}>
        <div className="flex items-center gap-3">
          <Avatar name={currentUser.display_name} color={currentUser.avatar_color} size={36} />
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{currentUser.display_name}</p>
            <p className="text-xs" style={{ color: "#8b9ab0" }}>@{currentUser.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewChat}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
            style={{ background: "#2AABEE" }}
            title="Новый чат"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
          <button
            onClick={onLogout}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: "#8b9ab0" }}
            title="Выйти"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#232e3c" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#8b9ab0">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск чатов..."
            className="bg-transparent text-sm outline-none flex-1"
            style={{ color: "white" }}
          />
        </div>
      </div>

      {/* Chat items */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#2b3a4a">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            <p className="text-sm" style={{ color: "#4a5568" }}>
              {search ? "Ничего не найдено" : "Нет чатов. Начните общение!"}
            </p>
          </div>
        ) : (
          filtered.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors"
              style={{
                background: selectedChatId === chat.id ? "#2b3a4a" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (selectedChatId !== chat.id)
                  e.currentTarget.style.background = "#1e2d3d";
              }}
              onMouseLeave={(e) => {
                if (selectedChatId !== chat.id)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <Avatar
                name={chat.display_name || chat.name || "?"}
                color={chat.display_color || "#2AABEE"}
                size={48}
                online={chat.type === "private" ? chat.partner_online : undefined}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium text-white truncate">
                    {chat.display_name || chat.name || "Чат"}
                    {chat.type === "group" && (
                      <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: "#2b3a4a", color: "#8b9ab0" }}>
                        группа
                      </span>
                    )}
                  </span>
                  <span className="text-xs flex-shrink-0 ml-2" style={{ color: "#8b9ab0" }}>
                    {timeAgo(chat.last_message_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm truncate" style={{ color: "#8b9ab0", maxWidth: "180px" }}>
                    {chat.last_message || "Нет сообщений"}
                  </p>
                  {chat.unread_count > 0 && (
                    <span
                      className="ml-2 flex-shrink-0 min-w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white px-1.5"
                      style={{ background: "#2AABEE" }}
                    >
                      {chat.unread_count > 99 ? "99+" : chat.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
