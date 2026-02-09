import { useState, useEffect } from "react";
import { Row, Col, Card, Spin } from "antd";
import {
  TeamOutlined,
  FlagOutlined,
  CalendarOutlined,
  FileSearchOutlined,
} from "@ant-design/icons";
import { supabase } from "../../lib/supabase";
import type { AdminRoute } from "./AdminApp";

interface DashboardStats {
  volunteerTotal: number;
  volunteerPending: number;
  raceCount: number;
  filingsTotal: number;
  filingsUnpromoted: number;
  activeCycleName: string;
}

interface DashboardPageProps {
  navigate: (route: AdminRoute) => void;
}

export default function DashboardPage({ navigate }: DashboardPageProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const [volunteersRes, cycleRes, racesRes, filingsRes] = await Promise.all([
        supabase.from("volunteers").select("id, status"),
        supabase
          .from("election_cycles")
          .select("name")
          .eq("is_active", true)
          .single(),
        supabase.from("races").select("id", { count: "exact", head: true }),
        supabase.from("fec_filings").select("id, promoted_to_candidate_id"),
      ]);

      const volunteers = volunteersRes.data ?? [];
      const filings = filingsRes.data ?? [];
      setStats({
        volunteerTotal: volunteers.length,
        volunteerPending: volunteers.filter((v) => v.status === "pending").length,
        raceCount: racesRes.count ?? 0,
        filingsTotal: filings.length,
        filingsUnpromoted: filings.filter((f) => !f.promoted_to_candidate_id).length,
        activeCycleName: cycleRes.data?.name ?? "None",
      });
      setLoading(false);
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

  return (
    <Row gutter={[12, 12]}>
      <Col xs={12} sm={6}>
        <Card
          hoverable
          onClick={() => navigate("volunteers")}
          style={{ borderRadius: 8 }}
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
              <TeamOutlined />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1 }}>
                Volunteers
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", lineHeight: 1.3 }}>
                {stats?.volunteerTotal ?? 0}
                {stats?.volunteerPending ? (
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#F59E0B", marginLeft: 6 }}>
                    {stats.volunteerPending} pending
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card
          hoverable
          onClick={() => navigate("races")}
          style={{ borderRadius: 8 }}
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
              <FlagOutlined />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1 }}>
                Races
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", lineHeight: 1.3 }}>
                {stats?.raceCount ?? 0}
              </div>
            </div>
          </div>
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card
          hoverable
          onClick={() => navigate("fec")}
          style={{ borderRadius: 8 }}
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
              <FileSearchOutlined />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1 }}>
                FEC Filings
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", lineHeight: 1.3 }}>
                {stats?.filingsTotal ?? 0}
                {stats?.filingsUnpromoted ? (
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#F59E0B", marginLeft: 6 }}>
                    {stats.filingsUnpromoted} unpromoted
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card
          hoverable
          onClick={() => navigate("cycles")}
          style={{ borderRadius: 8 }}
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
              <CalendarOutlined />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1 }}>
                Active Cycle
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#1E293B", lineHeight: 1.3 }}>
                {stats?.activeCycleName ?? "—"}
              </div>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
}
