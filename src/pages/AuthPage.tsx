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
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  }

  const isRegister = tab === "register";
  const canSubmit = !loading && !!username && (!isRegister || !!displayName);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      }}
    >
      {/* Ambient blobs */}
      <div style={{
        position: "absolute", top: "-120px", left: "-120px",
        width: "400px", height: "400px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-100px", right: "-100px",
        width: "360px", height: "360px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "40%", right: "10%",
        width: "200px", height: "200px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="w-full max-w-md mx-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          {/* Icon */}
          <div className="relative inline-flex mb-5">
            <div style={{
              width: "72px", height: "72px", borderRadius: "24px",
              background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 20px 60px rgba(139,92,246,0.5)",
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            {/* pulse ring */}
            <div style={{
              position: "absolute", inset: "-4px", borderRadius: "28px",
              border: "2px solid rgba(139,92,246,0.3)",
              animation: "pulse-ring 2s ease-in-out infinite",
            }} />
          </div>

          <h1 style={{
            fontSize: "28px", fontWeight: "800", color: "white",
            letterSpacing: "-0.5px", marginBottom: "6px",
          }}>
            {isRegister ? "Создать аккаунт" : "Добро пожаловать"}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px" }}>
            {isRegister
              ? "Заполните данные, чтобы начать общение"
              : "Войдите, чтобы продолжить"}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "24px",
          padding: "36px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        }}>
          {/* Tab switcher */}
          <div style={{
            display: "flex", background: "rgba(0,0,0,0.3)",
            borderRadius: "14px", padding: "4px", marginBottom: "28px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); setUsername(""); setDisplayName(""); }}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: "10px",
                  fontSize: "13px", fontWeight: "600",
                  transition: "all 0.25s ease",
                  background: tab === t
                    ? "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)"
                    : "transparent",
                  color: tab === t ? "white" : "rgba(255,255,255,0.4)",
                  border: "none", cursor: "pointer",
                  boxShadow: tab === t ? "0 4px 20px rgba(139,92,246,0.4)" : "none",
                }}
              >
                {t === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Username field */}
            <div>
              <label style={{
                display: "block", fontSize: "12px", fontWeight: "600",
                color: "rgba(255,255,255,0.5)", marginBottom: "8px",
                textTransform: "uppercase", letterSpacing: "0.8px",
              }}>
                Имя пользователя
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.3)", pointerEvents: "none",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, "_"))}
                  placeholder="ivan_ivanov"
                  autoComplete="username"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    paddingLeft: "42px", paddingRight: "16px",
                    paddingTop: "13px", paddingBottom: "13px",
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px", color: "white", fontSize: "14px",
                    outline: "none", transition: "border-color 0.2s, background 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(139,92,246,0.7)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                  }}
                />
              </div>
            </div>

            {/* Display name field (register only) */}
            <div style={{
              overflow: "hidden",
              maxHeight: isRegister ? "120px" : "0",
              opacity: isRegister ? 1 : 0,
              transition: "max-height 0.35s ease, opacity 0.25s ease",
            }}>
              <label style={{
                display: "block", fontSize: "12px", fontWeight: "600",
                color: "rgba(255,255,255,0.5)", marginBottom: "8px",
                textTransform: "uppercase", letterSpacing: "0.8px",
              }}>
                Отображаемое имя
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.3)", pointerEvents: "none",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Иван Иванов"
                  tabIndex={isRegister ? 0 : -1}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    paddingLeft: "42px", paddingRight: "16px",
                    paddingTop: "13px", paddingBottom: "13px",
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px", color: "white", fontSize: "14px",
                    outline: "none", transition: "border-color 0.2s, background 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(139,92,246,0.7)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                  }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 14px", borderRadius: "12px",
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#fca5a5", fontSize: "13px",
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                width: "100%", padding: "14px", borderRadius: "14px",
                fontSize: "15px", fontWeight: "700", color: "white",
                border: "none", cursor: canSubmit ? "pointer" : "not-allowed",
                background: canSubmit
                  ? "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)"
                  : "rgba(255,255,255,0.08)",
                boxShadow: canSubmit ? "0 8px 30px rgba(139,92,246,0.45)" : "none",
                transition: "all 0.25s ease",
                marginTop: "4px",
                transform: "translateY(0)",
                opacity: canSubmit ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                if (canSubmit) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(139,92,246,0.6)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = canSubmit ? "0 8px 30px rgba(139,92,246,0.45)" : "none";
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <span style={{
                    width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white", borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }} />
                  Загрузка...
                </span>
              ) : (
                isRegister ? "Создать аккаунт" : "Войти"
              )}
            </button>
          </form>

          {/* Switch hint */}
          <p style={{
            textAlign: "center", fontSize: "13px",
            color: "rgba(255,255,255,0.35)", marginTop: "20px",
          }}>
            {isRegister ? "Уже есть аккаунт? " : "Нет аккаунта? "}
            <button
              onClick={() => { setTab(isRegister ? "login" : "register"); setError(""); setUsername(""); setDisplayName(""); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#a78bfa", fontWeight: "600", fontSize: "13px",
                padding: 0,
              }}
            >
              {isRegister ? "Войти" : "Зарегистрироваться"}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: "center", fontSize: "12px",
          color: "rgba(255,255,255,0.2)", marginTop: "24px",
        }}>
          Безопасное общение в реальном времени
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        input::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>
    </div>
  );
}
