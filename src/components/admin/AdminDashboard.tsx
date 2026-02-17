import { useState, useEffect } from "react";
import { ConfigProvider, Spin, Result, Button } from "antd";
import type { User } from "@supabase/supabase-js";
import { getSession, isAdmin, onAuthStateChange, signOut } from "../../lib/supabase";
import AdminLayout from "./AdminLayout";

export type AdminRoute = "dashboard" | "volunteers" | "cycles" | "candidates" | "votes" | "races" | "ballot-measures" | "fec" | "calendar-events" | "states" | "automation" | "setup-guide";

const VALID_ROUTES: AdminRoute[] = ["dashboard", "volunteers", "cycles", "candidates", "votes", "races", "ballot-measures", "fec", "calendar-events", "states", "automation", "setup-guide"];

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

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<AdminRoute>("dashboard");

  // Check existing session on mount
  useEffect(() => {
    getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // If not authenticated, redirect to login
      if (!session?.user) {
        window.location.href = "/login";
      }
    });

    const {
      data: { subscription },
    } = onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      // Redirect to login if signed out
      if (!session?.user) {
        window.location.href = "/login";
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hash-based routing
  useEffect(() => {
    function handleHash() {
      const hash = window.location.hash.replace("#", "") as AdminRoute;
      if (VALID_ROUTES.includes(hash)) {
        setRoute(hash);
      } else {
        // Default to dashboard if no valid hash
        setRoute("dashboard");
        window.location.hash = "dashboard";
      }
    }

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const navigate = (newRoute: AdminRoute) => {
    setRoute(newRoute);
    window.location.hash = newRoute;
  };

  return (
    <ConfigProvider theme={theme}>
      {loading ? (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin size="large" />
        </div>
      ) : !user ? (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin size="large" tip="Redirecting to login..." />
        </div>
      ) : !isAdmin(user) ? (
        <Result
          status="403"
          title="Unauthorized"
          subTitle="You don't have admin access. Please contact the site administrator."
          extra={
            <Button onClick={() => signOut()}>Sign Out</Button>
          }
        />
      ) : (
        <AdminLayout route={route} navigate={navigate} user={user} />
      )}
    </ConfigProvider>
  );
}
