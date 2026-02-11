import { useState, useEffect, useRef } from "react";
import { Card, Spin, Button } from "antd";
import {
  TeamOutlined,
  FlagOutlined,
  CalendarOutlined,
  FileSearchOutlined,
  EnvironmentOutlined,
  LeftOutlined,
  RightOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { supabase } from "../../lib/supabase";
import type { AdminRoute } from "./AdminDashboard";

interface DashboardStats {
  volunteerTotal: number;
  volunteerPending: number;
  raceCount: number;
  filingsTotal: number;
  filingsUnpromoted: number;
  activeCycleName: string;
  statesWithGov: number;
  totalStates: number;
  lastSyncAt: string | null;
}

interface DashboardPageProps {
  navigate: (route: AdminRoute) => void;
}

function StatCard({ icon, label, value, sub, onClick }: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Card
      hoverable
      onClick={onClick}
      style={{ borderRadius: 8, minWidth: 200, flex: "0 0 auto" }}
      styles={{ body: { padding: "14px 16px" } }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            color: "#475569",
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1 }}>
            {label}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", lineHeight: 1.3 }}>
            {value}
            {sub && (
              <span style={{ fontSize: 12, fontWeight: 400, color: "#F59E0B", marginLeft: 6 }}>
                {sub}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage({ navigate }: DashboardPageProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
  }

  useEffect(() => {
    async function loadDashboard() {
      const [volunteersRes, cycleRes, racesRes, filingsRes, statesRes, automationRes] = await Promise.all([
        supabase.from("volunteers").select("id, status"),
        supabase
          .from("election_cycles")
          .select("name")
          .eq("is_active", true)
          .single(),
        supabase.from("races").select("id", { count: "exact", head: true }),
        supabase.from("fec_filings").select("id, promoted_to_candidate_id"),
        supabase.from("states").select("id, current_governor"),
        supabase.from("automation_config").select("last_sync_at").eq("id", 1).single(),
      ]);

      const volunteers = volunteersRes.data ?? [];
      const filings = filingsRes.data ?? [];
      const statesData = statesRes.data ?? [];
      setStats({
        volunteerTotal: volunteers.length,
        volunteerPending: volunteers.filter((v) => v.status === "pending").length,
        raceCount: racesRes.count ?? 0,
        filingsTotal: filings.length,
        filingsUnpromoted: filings.filter((f) => !f.promoted_to_candidate_id).length,
        activeCycleName: cycleRes.data?.name ?? "None",
        totalStates: statesData.length,
        statesWithGov: statesData.filter((s) => s.current_governor).length,
        lastSyncAt: automationRes.data?.last_sync_at ?? null,
      });
      setLoading(false);
      // Defer scroll check until cards render
      setTimeout(checkScroll, 50);
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const missingGov = (stats?.totalStates ?? 0) - (stats?.statesWithGov ?? 0);

  return (
    <div style={{ position: "relative" }}>
      {canScrollLeft && (
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => scroll("left")}
          style={{
            position: "absolute",
            left: -4,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            borderRadius: "50%",
            width: 28,
            height: 28,
          }}
          size="small"
        />
      )}
      {canScrollRight && (
        <Button
          type="text"
          icon={<RightOutlined />}
          onClick={() => scroll("right")}
          style={{
            position: "absolute",
            right: -4,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            borderRadius: "50%",
            width: 28,
            height: 28,
          }}
          size="small"
        />
      )}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        onLoad={checkScroll}
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          scrollbarWidth: "none",
          padding: "2px 0",
        }}
      >
        <StatCard
          icon={<TeamOutlined />}
          label="Volunteers"
          value={stats?.volunteerTotal ?? 0}
          sub={stats?.volunteerPending ? `${stats.volunteerPending} pending` : undefined}
          onClick={() => navigate("volunteers")}
        />
        <StatCard
          icon={<FlagOutlined />}
          label="Races"
          value={stats?.raceCount ?? 0}
          onClick={() => navigate("races")}
        />
        <StatCard
          icon={<FileSearchOutlined />}
          label="FEC Filings"
          value={stats?.filingsTotal ?? 0}
          sub={stats?.filingsUnpromoted ? `${stats.filingsUnpromoted} unpromoted` : undefined}
          onClick={() => navigate("fec")}
        />
        <StatCard
          icon={<CalendarOutlined />}
          label="Active Cycle"
          value={<span style={{ fontSize: 16, fontWeight: 600 }}>{stats?.activeCycleName ?? "—"}</span>}
          onClick={() => navigate("cycles")}
        />
        <StatCard
          icon={<EnvironmentOutlined />}
          label="States"
          value={stats?.totalStates ?? 0}
          sub={missingGov > 0 ? `${missingGov} missing gov` : undefined}
          onClick={() => navigate("states")}
        />
        <StatCard
          icon={<SyncOutlined />}
          label="Last FEC Sync"
          value={
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {stats?.lastSyncAt
                ? new Date(stats.lastSyncAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "Never"}
            </span>
          }
          onClick={() => navigate("automation")}
        />
      </div>
    </div>
  );
}
