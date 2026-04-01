import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { saveUser } from "@/lib/store";
import type { User } from "@/lib/store";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface Props {
  onAuth: (user: User) => void;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const YANDEX_CLIENT_ID = import.meta.env.VITE_YANDEX_CLIENT_ID || "";

export default function AuthPage({ onAuth }: Props) {
  const [loading, setLoading] = useState<"google" | "yandex" | null>(null);
  const [error, setError] = useState("");

  // Handle Yandex OAuth callback via URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.slice(1));
      const token = params.get("access_token");
      if (token) {
        window.history.replaceState(null, "", window.location.pathname);
        handleYandexToken(token);
      }
    }
  }, []);

  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  async function handleGoogleResponse(response: { credential: string }) {
    setLoading("google");
    setError("");
    try {
      const data = await api.oauthLogin("google", response.credential) as { user: User };
      saveUser(data.user);
      onAuth(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка входа через Google");
    } finally {
      setLoading(null);
    }
  }

  function handleGoogleClick() {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google Client ID не настроен. Добавьте VITE_GOOGLE_CLIENT_ID.");
      return;
    }
    setError("");
    setLoading("google");
    window.google?.accounts.id.prompt();
    // If prompt doesn't fire callback, reset loading after timeout
    setTimeout(() => setLoading(null), 5000);
  }

  function handleYandexClick() {
    if (!YANDEX_CLIENT_ID) {
      setError("Yandex Client ID не настроен. Добавьте VITE_YANDEX_CLIENT_ID.");
      return;
    }
    setError("");
    setLoading("yandex");
    const redirectUri = window.location.origin + window.location.pathname;
    const url =
      `https://oauth.yandex.ru/authorize?response_type=token` +
      `&client_id=${encodeURIComponent(YANDEX_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&force_confirm=no`;
    window.location.href = url;
  }

  async function handleYandexToken(token: string) {
    setLoading("yandex");
    setError("");
    try {
      const data = await api.oauthLogin("yandex", token) as { user: User };
      saveUser(data.user);
      onAuth(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка входа через Yandex");
    } finally {
      setLoading(null);
    }
  }

  const isLoading = loading !== null;

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
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

      <div className="w-full max-w-sm mx-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="relative inline-flex mb-5">
            <div style={{
              width: "72px", height: "72px", borderRadius: "24px",
              background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 20px 60px rgba(139,92,246,0.5)",
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
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
            Добро пожаловать
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px" }}>
            Войдите через аккаунт, чтобы начать общение
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
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}>

          {/* Google button */}
          <button
            onClick={handleGoogleClick}
            disabled={isLoading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
              width: "100%", padding: "14px 20px",
              background: loading === "google" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.95)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "14px", cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "15px", fontWeight: "600",
              color: "#1f1f1f",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              opacity: isLoading && loading !== "google" ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.background = "white";
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.background = "rgba(255,255,255,0.95)";
            }}
          >
            {loading === "google" ? (
              <div style={{
                width: "20px", height: "20px",
                border: "2px solid #ccc",
                borderTopColor: "#4285F4",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span>{loading === "google" ? "Входим..." : "Войти через Google"}</span>
          </button>

          {/* Yandex button */}
          <button
            onClick={handleYandexClick}
            disabled={isLoading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
              width: "100%", padding: "14px 20px",
              background: loading === "yandex" ? "rgba(252,75,5,0.4)" : "rgba(252,75,5,0.85)",
              border: "1px solid rgba(252,75,5,0.3)",
              borderRadius: "14px", cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "15px", fontWeight: "600",
              color: "white",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 20px rgba(252,75,5,0.3)",
              opacity: isLoading && loading !== "yandex" ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.background = "rgba(252,75,5,1)";
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.background = "rgba(252,75,5,0.85)";
            }}
          >
            {loading === "yandex" ? (
              <div style={{
                width: "20px", height: "20px",
                border: "2px solid rgba(255,255,255,0.4)",
                borderTopColor: "white",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="white" />
                <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#FC4B05" fontFamily="Arial">Я</text>
              </svg>
            )}
            <span>{loading === "yandex" ? "Переход..." : "Войти через Yandex"}</span>
          </button>

          {/* Error */}
          {error && (
            <div style={{
              padding: "12px 16px",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "12px",
              color: "#fca5a5",
              fontSize: "13px",
              textAlign: "center",
              lineHeight: "1.5",
            }}>
              {error}
            </div>
          )}

          <p style={{
            color: "rgba(255,255,255,0.25)",
            fontSize: "12px",
            textAlign: "center",
            marginTop: "4px",
            lineHeight: "1.6",
          }}>
            При первом входе аккаунт создаётся автоматически
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
