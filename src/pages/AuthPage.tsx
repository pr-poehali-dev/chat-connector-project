import { useState } from "react";
import { api } from "@/lib/api";
import { saveUser } from "@/lib/store";
import type { User } from "@/lib/store";

interface Props {
  onAuth: (user: User) => void;
}

export default function AuthPage({ onAuth }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "register") {
        const data = await api.register(username, displayName);
        saveUser(data.user);
        onAuth(data.user);
      } else {
        const data = await api.login(username);
        saveUser(data.user);
        onAuth(data.user);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#17212b" }}>
      <div className="w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #2AABEE 0%, #1e8bc3 100%)" }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
              <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Messenger</h1>
          <p className="text-sm mt-1" style={{ color: "#8b9ab0" }}>Общайтесь с кем угодно</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={{ background: "#232e3c" }}>
          {/* Tabs */}
          <div className="flex mb-6 rounded-xl p-1" style={{ background: "#17212b" }}>
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: tab === t ? "#2AABEE" : "transparent",
                  color: tab === t ? "white" : "#8b9ab0",
                }}
              >
                {t === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm mb-1.5 block" style={{ color: "#8b9ab0" }}>
                Имя пользователя
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="например: ivan_ivanov"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                style={{
                  background: "#17212b",
                  border: "1.5px solid #2b3a4a",
                  color: "white",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#2AABEE")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2b3a4a")}
                autoComplete="username"
              />
            </div>

            {tab === "register" && (
              <div>
                <label className="text-sm mb-1.5 block" style={{ color: "#8b9ab0" }}>
                  Отображаемое имя
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Иван Иванов"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "#17212b",
                    border: "1.5px solid #2b3a4a",
                    color: "white",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#2AABEE")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#2b3a4a")}
                />
              </div>
            )}

            {error && (
              <div className="text-sm px-4 py-2.5 rounded-xl" style={{ background: "rgba(229,57,53,0.15)", color: "#ef5350" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || (tab === "register" && !displayName)}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 mt-2"
              style={{
                background: loading || !username ? "#1e6a8a" : "#2AABEE",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Загрузка..." : tab === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </form>

          {tab === "login" && (
            <p className="text-center text-xs mt-4" style={{ color: "#8b9ab0" }}>
              Нет аккаунта?{" "}
              <button onClick={() => setTab("register")} style={{ color: "#2AABEE" }}>
                Зарегистрироваться
              </button>
            </p>
          )}
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "#4a5568" }}>
          Работает на основе открытого API
        </p>
      </div>
    </div>
  );
}
