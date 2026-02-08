import { useState, type ReactNode } from "react";
import { Layout, Menu, Button, Typography, theme } from "antd";
import {
  DashboardOutlined,
  TeamOutlined,
  CalendarOutlined,
  UserOutlined,
  TrophyOutlined,
  FileTextOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import type { User } from "@supabase/supabase-js";
import type { AdminRoute } from "./AdminApp";
import { signOut } from "../../lib/supabase";
import DashboardPage from "./DashboardPage";
import VolunteersPage from "./VolunteersPage";
import CyclesPage from "./CyclesPage";
import CandidatesPage from "./CandidatesPage";
import RacesPage from "./RacesPage";
import BallotMeasuresPage from "./BallotMeasuresPage";

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

interface AdminLayoutProps {
  route: AdminRoute;
  navigate: (route: AdminRoute) => void;
  user: User;
}

const menuItems = [
  { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "volunteers", icon: <TeamOutlined />, label: "Volunteers" },
  { key: "cycles", icon: <CalendarOutlined />, label: "Election Cycles" },
  { key: "candidates", icon: <UserOutlined />, label: "Candidates" },
  { key: "races", icon: <TrophyOutlined />, label: "Races" },
  { key: "ballot-measures", icon: <FileTextOutlined />, label: "Ballot Measures" },
];

const ROUTE_TITLES: Record<AdminRoute, string> = {
  dashboard: "Dashboard",
  volunteers: "Volunteers",
  cycles: "Election Cycles",
  candidates: "Candidates",
  races: "Races",
  "ballot-measures": "Ballot Measures",
};

/** CSS-only animated hamburger/arrow toggle */
function SidebarToggle({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  const barStyle = (i: number): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: "block",
      width: 18,
      height: 2,
      background: "#64748b",
      borderRadius: 1,
      transition: "all 0.25s ease",
      transformOrigin: "center",
    };
    if (collapsed) {
      if (i === 0) return { ...base, transform: "translateY(6px) rotate(45deg)" };
      if (i === 1) return { ...base, opacity: 0, transform: "scaleX(0)" };
      if (i === 2) return { ...base, transform: "translateY(-6px) rotate(-45deg)" };
    }
    return base;
  };

  return (
    <button
      onClick={onClick}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: 6,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        borderRadius: 4,
      }}
    >
      <span style={barStyle(0)} />
      <span style={barStyle(1)} />
      <span style={barStyle(2)} />
    </button>
  );
}

export default function AdminLayout({ route, navigate, user }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [headerActions, setHeaderActions] = useState<ReactNode>(null);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        breakpoint="lg"
        collapsedWidth={80}
        style={{
          background: "#1E293B",
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10,
        }}
      >
        <a
          href="/"
          style={{
            display: "block",
            padding: collapsed ? "16px 8px" : "16px",
            textAlign: "center",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            textDecoration: "none",
          }}
          title="Back to main site"
        >
          <Text
            strong
            style={{ color: "white", fontSize: collapsed ? 12 : 14 }}
          >
            {collapsed ? "TMP" : "The Midterm Project"}
          </Text>
          {!collapsed && (
            <div>
              <Text style={{ color: "#F59E0B", fontSize: 11 }}>Admin</Text>
            </div>
          )}
        </a>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[route]}
          items={menuItems}
          onClick={({ key }) => navigate(key as AdminRoute)}
          style={{ background: "transparent", borderRight: "none" }}
        />

        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            padding: collapsed ? "12px 8px" : "12px 16px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {!collapsed && (
            <Text
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 12,
                display: "block",
                marginBottom: 8,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.email}
            </Text>
          )}
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={() => signOut()}
            style={{ color: "rgba(255,255,255,0.6)", width: "100%", textAlign: "left" }}
            size="small"
          >
            {collapsed ? "" : "Sign Out"}
          </Button>
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: "margin-left 0.2s" }}>
        <Header
          style={{
            padding: "0 20px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #f0f0f0",
            height: 48,
            lineHeight: "48px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SidebarToggle collapsed={collapsed} onClick={() => setCollapsed(!collapsed)} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>
              {ROUTE_TITLES[route]}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {headerActions}
          </div>
        </Header>
        <Content style={{ margin: 20, minHeight: 280 }}>
          {route === "dashboard" && <DashboardPage navigate={navigate} />}
          {route === "volunteers" && <VolunteersPage setHeaderActions={setHeaderActions} />}
          {route === "cycles" && <CyclesPage setHeaderActions={setHeaderActions} />}
          {route === "candidates" && <CandidatesPage setHeaderActions={setHeaderActions} />}
          {route === "races" && <RacesPage setHeaderActions={setHeaderActions} />}
          {route === "ballot-measures" && <BallotMeasuresPage setHeaderActions={setHeaderActions} />}
        </Content>
      </Layout>
    </Layout>
  );
}
