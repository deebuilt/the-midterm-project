import { useState, useEffect } from "react";
import { ConfigProvider, Spin } from "antd";
import type { User } from "@supabase/supabase-js";
import { getSession, onAuthStateChange } from "../../lib/supabase";
import LoginPage from "./LoginPage";

const theme = {
  token: {
    colorPrimary: "#1E293B",
    colorLink: "#1E293B",
    borderRadius: 6,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
  },
};

export default function LoginFlow() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check existing session + handle magic link callback
  useEffect(() => {
    getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // If authenticated, redirect to admin dashboard
      if (session?.user) {
        window.location.href = "/admin#dashboard";
      }
    });

    const {
      data: { subscription },
    } = onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      // Redirect on successful auth
      if (session?.user) {
        window.location.href = "/admin#dashboard";
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // If already logged in, show loading while redirecting
  if (user) {
    return (
      <ConfigProvider theme={theme}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f5f5",
          }}
        >
          <Spin size="large" tip="Redirecting to admin panel..." />
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={theme}>
      {loading ? (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f5f5",
          }}
        >
          <Spin size="large" />
        </div>
      ) : (
        <LoginPage />
      )}
    </ConfigProvider>
  );
}
