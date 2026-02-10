import { useState, type ReactNode } from "react";
import { Layout, Menu, Button, Typography, Popover, theme } from "antd";
import {
  DashboardOutlined,
  TeamOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  UserOutlined,
  TrophyOutlined,
  FileTextOutlined,
  CloudDownloadOutlined,
  LogoutOutlined,
  EnvironmentOutlined,
  BookOutlined,
  RobotOutlined,
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
import CalendarEventsPage from "./CalendarEventsPage";
import FecPage from "./FecPage";
import StatesPage from "./StatesPage";
import AutomationPage from "./AutomationPage";
import SetupGuidePage from "./SetupGuidePage";

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
  { key: "calendar-events", icon: <ScheduleOutlined />, label: "Calendar Events" },
  { key: "fec", icon: <CloudDownloadOutlined />, label: "FEC" },
  { key: "automation", icon: <RobotOutlined />, label: "Automation" },
  { key: "states", icon: <EnvironmentOutlined />, label: "States" },
];

const ROUTE_TITLES: Record<AdminRoute, string> = {
  dashboard: "Dashboard",
  volunteers: "Volunteers",
  cycles: "Election Cycles",
  candidates: "Candidates",
  races: "Races",
  "ballot-measures": "Ballot Measures",
  "calendar-events": "Calendar Events",
  fec: "FEC",
  automation: "Automation",
  states: "States",
  "setup-guide": "Setup Guide",
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
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            padding: collapsed ? "16px 8px" : "16px",
            textAlign: "center",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            textDecoration: "none",
          }}
          title="Open main site in new tab"
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
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Popover
            placement="topLeft"
            trigger="click"
            arrow={false}
            content={
              <div style={{ minWidth: 180 }}>
                <div style={{ padding: "4px 0 8px", borderBottom: "1px solid #f0f0f0", marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, color: "#64748b" }}>{user.email}</Text>
                </div>
                <Button
                  type="text"
                  icon={<BookOutlined />}
                  onClick={() => navigate("setup-guide")}
                  style={{ width: "100%", textAlign: "left", marginBottom: 4 }}
                  size="small"
                >
                  Setup Guide
                </Button>
                <Button
                  type="text"
                  danger
                  icon={<LogoutOutlined />}
                  onClick={() => signOut()}
                  style={{ width: "100%", textAlign: "left" }}
                  size="small"
                >
                  Sign Out
                </Button>
              </div>
            }
          >
            <div
              style={{
                padding: collapsed ? "12px 8px" : "12px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {(user.email?.[0] ?? "A").toUpperCase()}
              </div>
              {!collapsed && (
                <Text
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 12,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.email}
                </Text>
              )}
            </div>
          </Popover>
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
          {route === "calendar-events" && <CalendarEventsPage setHeaderActions={setHeaderActions} />}
          {route === "fec" && <FecPage setHeaderActions={setHeaderActions} />}
          {route === "automation" && <AutomationPage setHeaderActions={setHeaderActions} />}
          {route === "states" && <StatesPage setHeaderActions={setHeaderActions} />}
          {route === "setup-guide" && <SetupGuidePage navigate={navigate} />}
        </Content>
      </Layout>
    </Layout>
  );
}
