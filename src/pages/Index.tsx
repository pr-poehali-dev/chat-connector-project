import { useState, useEffect } from "react";
import { loadUser, type User } from "@/lib/store";
import AuthPage from "./AuthPage";
import MessengerPage from "./MessengerPage";

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const saved = loadUser();
    setUser(saved);
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "#17212b" }}>
        <div
          className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
          style={{ border: "3px solid #2AABEE", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuth={(u) => setUser(u)} />;
  }

  return <MessengerPage currentUser={user} onLogout={() => setUser(null)} />;
}
