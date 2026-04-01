import { useState, useEffect, useCallback, useRef } from "react";
import type { Chat, User } from "@/lib/store";
import { clearUser } from "@/lib/store";
import { api } from "@/lib/api";
import ChatList from "@/components/messenger/ChatList";
import ChatWindow from "@/components/messenger/ChatWindow";
import NewChatModal from "@/components/messenger/NewChatModal";

interface Props {
  currentUser: User;
  onLogout: () => void;
}

export default function MessengerPage({ currentUser, onLogout }: Props) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const lastUpdateRef = useRef<string>(new Date().toISOString());
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadChats = useCallback(async () => {
    try {
      const data = await api.getChats(currentUser.id);
      setChats(data.chats || []);
    } catch { /* silent */ }
  }, [currentUser.id]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Poll for chat list updates
  useEffect(() => {
    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    updateIntervalRef.current = setInterval(async () => {
      try {
        const data = await api.chatUpdates(currentUser.id, lastUpdateRef.current);
        if (data.updates && data.updates.length > 0) {
          lastUpdateRef.current = new Date().toISOString();
          loadChats();
        }
      } catch { /* silent */ }
    }, 5000);
    return () => {
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    };
  }, [currentUser.id, loadChats]);

  function handleSelectChat(chat: Chat) {
    setSelectedChat(chat);
    setMobileView("chat");
    // clear unread
    setChats((prev) => prev.map((c) => c.id === chat.id ? { ...c, unread_count: 0 } : c));
  }

  function handleBack() {
    setMobileView("list");
    loadChats();
  }

  function handleLogout() {
    api.logout(currentUser.id).catch(() => {});
    clearUser();
    onLogout();
  }

  async function handleChatCreated(chatId: string) {
    setShowNewChat(false);
    await loadChats();
    const data = await api.getChats(currentUser.id);
    const allChats: Chat[] = data.chats || [];
    const found = allChats.find((c) => c.id === chatId);
    if (found) {
      handleSelectChat(found);
    }
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "#0d1621" }}>
      {/* Sidebar - chat list */}
      <div
        className={`${mobileView === "list" ? "flex" : "hidden"} md:flex flex-col border-r`}
        style={{
          width: "100%",
          maxWidth: "360px",
          borderColor: "#0d1621",
          flexShrink: 0,
        }}
      >
        <ChatList
          currentUser={currentUser}
          chats={chats}
          selectedChatId={selectedChat?.id || null}
          onSelectChat={handleSelectChat}
          onNewChat={() => setShowNewChat(true)}
          onLogout={handleLogout}
        />
      </div>

      {/* Main - chat window */}
      <div
        className={`${mobileView === "chat" ? "flex" : "hidden"} md:flex flex-col flex-1 min-w-0`}
      >
        {selectedChat ? (
          <ChatWindow
            key={selectedChat.id}
            chat={selectedChat}
            currentUser={currentUser}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center" style={{ background: "#0d1621" }}>
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ background: "#17212b" }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="#2AABEE" opacity="0.6">
                <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Messenger</h2>
            <p className="text-sm text-center max-w-xs" style={{ color: "#8b9ab0" }}>
              Выберите чат слева или создайте новый, нажав «+»
            </p>
            <button
              onClick={() => setShowNewChat(true)}
              className="mt-6 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
              style={{ background: "#2AABEE" }}
            >
              Начать общение
            </button>
          </div>
        )}
      </div>

      {/* New chat modal */}
      {showNewChat && (
        <NewChatModal
          currentUser={currentUser}
          onClose={() => setShowNewChat(false)}
          onChatCreated={handleChatCreated}
        />
      )}
    </div>
  );
}
