import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/store";
import Avatar from "./Avatar";

interface Props {
  currentUser: User;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export default function NewChatModal({ currentUser, onClose, onChatCreated }: Props) {
  const [tab, setTab] = useState<"private" | "group">("private");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getUsers(currentUser.id, search).then((data) => {
      setUsers(data.users || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [search, currentUser.id]);

  async function handleSelectUser(user: User) {
    if (tab === "private") {
      setCreating(true);
      try {
        const data = await api.createPrivateChat(currentUser.id, user.id);
        onChatCreated(data.chat_id);
      } catch { /* silent */ } finally {
        setCreating(false);
      }
    } else {
      setSelectedUsers((prev) =>
        prev.find((u) => u.id === user.id)
          ? prev.filter((u) => u.id !== user.id)
          : [...prev, user]
      );
    }
  }

  async function createGroup() {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    setCreating(true);
    try {
      const data = await api.createGroupChat(currentUser.id, groupName.trim(), selectedUsers.map((u) => u.id));
      onChatCreated(data.chat.id);
    } catch { /* silent */ } finally {
      setCreating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{ background: "#232e3c" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#17212b" }}>
          <h3 className="text-base font-semibold text-white">Новый чат</h3>
          <button onClick={onClose} style={{ color: "#8b9ab0" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-3 gap-2">
          {(["private", "group"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelectedUsers([]); }}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: tab === t ? "#2AABEE" : "#17212b",
                color: tab === t ? "white" : "#8b9ab0",
              }}
            >
              {t === "private" ? "Личный чат" : "Группа"}
            </button>
          ))}
        </div>

        {/* Group name input */}
        {tab === "group" && (
          <div className="px-4 pb-2">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Название группы"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#17212b", color: "white", border: "1px solid #2b3a4a" }}
            />
          </div>
        )}

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#17212b" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#8b9ab0">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск пользователей..."
              className="bg-transparent text-sm outline-none flex-1"
              style={{ color: "white" }}
            />
          </div>
        </div>

        {/* Selected for group */}
        {tab === "group" && selectedUsers.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {selectedUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                style={{ background: "#2AABEE22", color: "#2AABEE", border: "1px solid #2AABEE55" }}
              >
                {u.display_name}
                <button onClick={() => setSelectedUsers((p) => p.filter((x) => x.id !== u.id))}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Users list */}
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#2AABEE", borderTopColor: "transparent" }} />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "#4a5568" }}>Пользователи не найдены</p>
          ) : (
            users.map((user) => {
              const isSelected = selectedUsers.find((u) => u.id === user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  disabled={creating}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors hover:opacity-80"
                  style={{ background: isSelected ? "#1e6a8a22" : "transparent" }}
                >
                  <Avatar name={user.display_name} color={user.avatar_color} size={40} online={user.is_online} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.display_name}</p>
                    <p className="text-xs" style={{ color: "#8b9ab0" }}>@{user.username}</p>
                  </div>
                  {tab === "group" && isSelected && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#2AABEE">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Create group button */}
        {tab === "group" && (
          <div className="px-4 py-4 border-t" style={{ borderColor: "#17212b" }}>
            <button
              onClick={createGroup}
              disabled={!groupName.trim() || selectedUsers.length === 0 || creating}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all"
              style={{
                background: groupName.trim() && selectedUsers.length > 0 ? "#2AABEE" : "#2b3a4a",
                opacity: creating ? 0.7 : 1,
              }}
            >
              {creating ? "Создание..." : `Создать группу (${selectedUsers.length} участн.)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
