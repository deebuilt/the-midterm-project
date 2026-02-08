import { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Button,
  Tag,
  Spin,
  Typography,
} from "antd";
import {
  TeamOutlined,
  FlagOutlined,
  UserOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { supabase } from "../../lib/supabase";
import type { AdminRoute } from "./AdminApp";

const { Title } = Typography;

interface DashboardStats {
  volunteerTotal: number;
  volunteerPending: number;
  raceCount: number;
  candidateCount: number;
  activeCycleName: string;
}

interface RecentVolunteer {
  id: number;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

interface DashboardPageProps {
  navigate: (route: AdminRoute) => void;
}

export default function DashboardPage({ navigate }: DashboardPageProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentVolunteers, setRecentVolunteers] = useState<RecentVolunteer[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const [volunteersRes, cycleRes, racesRes, candidatesRes] =
        await Promise.all([
          supabase.from("volunteers").select("id, status"),
          supabase
            .from("election_cycles")
            .select("name")
            .eq("is_active", true)
            .single(),
          supabase.from("races").select("id", { count: "exact", head: true }),
          supabase
            .from("candidates")
            .select("id", { count: "exact", head: true }),
        ]);

      const volunteers = volunteersRes.data ?? [];
      setStats({
        volunteerTotal: volunteers.length,
        volunteerPending: volunteers.filter((v) => v.status === "pending")
          .length,
        raceCount: racesRes.count ?? 0,
        candidateCount: candidatesRes.count ?? 0,
        activeCycleName: cycleRes.data?.name ?? "None",
      });

      const { data: recent } = await supabase
        .from("volunteers")
        .select("id, name, email, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentVolunteers(recent ?? []);
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

  const statusColor: Record<string, string> = {
    active: "green",
    pending: "orange",
    inactive: "default",
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColor[status]}>{status}</Tag>
      ),
    },
    {
      title: "Joined",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            hoverable
            onClick={() => navigate("volunteers")}
          >
            <Statistic
              title="Volunteers"
              value={stats?.volunteerTotal ?? 0}
              prefix={<TeamOutlined />}
              suffix={
                stats?.volunteerPending ? (
                  <span
                    style={{ fontSize: 14, color: "#F59E0B" }}
                  >
                    ({stats.volunteerPending} pending)
                  </span>
                ) : null
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            hoverable
            onClick={() => navigate("cycles")}
          >
            <Statistic
              title="Races"
              value={stats?.raceCount ?? 0}
              prefix={<FlagOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <Statistic
              title="Candidates"
              value={stats?.candidateCount ?? 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <Statistic
              title="Active Cycle"
              value={stats?.activeCycleName ?? "—"}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Recent Volunteers"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
        extra={
          <Button
            type="link"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate("volunteers")}
          >
            View All
          </Button>
        }
      >
        <Table
          dataSource={recentVolunteers}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
