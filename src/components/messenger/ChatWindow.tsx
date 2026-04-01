import { useState, useEffect, useRef, useCallback } from "react";
import type { Chat, Message, User } from "@/lib/store";
import { api } from "@/lib/api";
import Avatar from "./Avatar";

interface Props {
  chat: Chat;
  currentUser: User;
  onBack: () => void;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Сегодня";
  if (d.toDateString() === yesterday.toDateString()) return "Вчера";
  return d.toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" });
}

export default function ChatWindow({ chat, currentUser, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTimeRef = useRef<string>(new Date().toISOString());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((smooth = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Load messages
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMessages([]);
    api.getMessages(chat.id, currentUser.id).then((data) => {
      if (!cancelled) {
        setMessages(data.messages || []);
        if (data.messages?.length > 0) {
          lastMessageTimeRef.current = data.messages[data.messages.length - 1].created_at;
        } else {
          lastMessageTimeRef.current = new Date().toISOString();
        }
        setLoading(false);
        setTimeout(() => scrollToBottom(), 50);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [chat.id, currentUser.id, scrollToBottom]);

  // Long polling
  useEffect(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(async () => {
      try {
        const data = await api.poll(chat.id, lastMessageTimeRef.current, currentUser.id);
        if (data.messages && data.messages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMsgs = data.messages.filter((m: Message) => !existingIds.has(m.id));
            if (newMsgs.length === 0) return prev;
            lastMessageTimeRef.current = data.messages[data.messages.length - 1].created_at;
            setTimeout(() => scrollToBottom(true), 50);
            return [...prev, ...newMsgs];
          });
        }
      } catch { /* silent */ }
    }, 2000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [chat.id, currentUser.id, scrollToBottom]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    // optimistic
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      chat_id: chat.id,
      sender_id: currentUser.id,
      sender_name: currentUser.display_name,
      sender_color: currentUser.avatar_color,
      sender_username: currentUser.username,
      content: text,
      type: "text",
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => scrollToBottom(true), 50);
    try {
      const data = await api.sendMessage(chat.id, currentUser.id, text);
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? data.message : m));
      lastMessageTimeRef.current = data.message.created_at;
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({ date, msgs: [msg] });
    }
  });

  return (
    <div className="flex flex-col h-full" style={{ background: "#0d1621" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: "#17212b", borderColor: "#0d1621" }}
      >
        <button
          onClick={onBack}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-full"
          style={{ color: "#8b9ab0" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <Avatar
          name={chat.display_name || chat.name || "?"}
          color={chat.display_color || "#2AABEE"}
          size={40}
          online={chat.type === "private" ? chat.partner_online : undefined}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {chat.display_name || chat.name}
          </p>
          <p className="text-xs" style={{ color: "#8b9ab0" }}>
            {chat.type === "private"
              ? chat.partner_online ? "в сети" : "не в сети"
              : "группа"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#2AABEE", borderTopColor: "transparent" }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#17212b" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#2b3a4a">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
            </div>
            <p className="text-sm" style={{ color: "#4a5568" }}>Нет сообщений. Начните чат!</p>
          </div>
        ) : (
          groupedMessages.map(({ date, msgs }) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: "#1e2d3d" }} />
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: "#17212b", color: "#8b9ab0" }}>
                  {date}
                </span>
                <div className="flex-1 h-px" style={{ background: "#1e2d3d" }} />
              </div>
              {msgs.map((msg, idx) => {
                const isMe = msg.sender_id === currentUser.id;
                const prevMsg = idx > 0 ? msgs[idx - 1] : null;
                const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
                const showName = !isMe && chat.type === "group" && showAvatar;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 mb-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar placeholder for alignment */}
                    {!isMe && (
                      <div style={{ width: 32, flexShrink: 0 }}>
                        {showAvatar && (
                          <Avatar name={msg.sender_name || "?"} color={msg.sender_color || "#2AABEE"} size={32} />
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
                      {showName && (
                        <span className="text-xs font-medium mb-1 px-1" style={{ color: msg.sender_color || "#2AABEE" }}>
                          {msg.sender_name}
                        </span>
                      )}
                      <div
                        className="px-3 py-2 rounded-2xl text-sm relative group"
                        style={{
                          background: isMe ? "#2AABEE" : "#232e3c",
                          color: isMe ? "white" : "#e8edf3",
                          borderBottomRightRadius: isMe ? 4 : 16,
                          borderBottomLeftRadius: isMe ? 16 : 4,
                          wordBreak: "break-word",
                          opacity: msg.id.startsWith("opt-") ? 0.7 : 1,
                        }}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-end"}`}>
                          <span className="text-xs" style={{ color: isMe ? "rgba(255,255,255,0.7)" : "#8b9ab0" }}>
                            {formatTime(msg.created_at)}
                          </span>
                          {isMe && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={msg.is_read ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)"}>
                              {msg.is_read
                                ? <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
                                : <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>}
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t" style={{ background: "#17212b", borderColor: "#0d1621" }}>
        <div className="flex items-end gap-3">
          <div
            className="flex-1 flex items-end rounded-2xl px-4 py-2"
            style={{ background: "#232e3c", border: "1px solid #2b3a4a" }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Написать сообщение..."
              rows={1}
              className="flex-1 bg-transparent text-sm outline-none resize-none"
              style={{
                color: "white",
                maxHeight: "120px",
                lineHeight: "1.5",
              }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: input.trim() ? "#2AABEE" : "#232e3c",
              opacity: sending ? 0.7 : 1,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
