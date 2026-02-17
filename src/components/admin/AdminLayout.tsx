import { useState, type ReactNode } from "react";
import { Layout, Menu, Button, Typography, Popover, Drawer, theme } from "antd";
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
  AuditOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import type { User } from "@supabase/supabase-js";
import type { AdminRoute } from "./AdminDashboard";
import { signOut } from "../../lib/supabase";
import { useIsMobile } from "./useIsMobile";
import DashboardPage from "./DashboardPage";
import VolunteersPage from "./VolunteersPage";
import CyclesPage from "./CyclesPage";
import CandidatesPage from "./CandidatesPage";
import VotesPage from "./VotesPage";
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
  { key: "votes", icon: <AuditOutlined />, label: "Voting Records" },
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
  votes: "Voting Records",
  races: "Races",
  "ballot-measures": "Ballot Measures",
  "calendar-events": "Calendar Events",
  fec: "FEC",
  automation: "Automation",
  states: "States",
  "setup-guide": "Setup Guide",
};

// Bottom nav: 5 priority items + More
const BOTTOM_NAV_ITEMS: { key: AdminRoute; icon: ReactNode; label: string }[] = [
  { key: "dashboard", icon: <DashboardOutlined />, label: "Home" },
  { key: "candidates", icon: <UserOutlined />, label: "Candidates" },
  { key: "votes", icon: <AuditOutlined />, label: "Votes" },
  { key: "races", icon: <TrophyOutlined />, label: "Races" },
  { key: "calendar-events", icon: <ScheduleOutlined />, label: "Calendar" },
];

const BOTTOM_NAV_KEYS = new Set(BOTTOM_NAV_ITEMS.map((i) => i.key));

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
  const [moreOpen, setMoreOpen] = useState(false);
  const isMobile = useIsMobile();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleNavClick = (key: AdminRoute) => {
    navigate(key);
    setMoreOpen(false);
  };

  // Items that go in the "More" drawer on mobile
  const moreMenuItems = menuItems.filter((item) => !BOTTOM_NAV_KEYS.has(item.key as AdminRoute));

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Desktop sidebar */}
      {!isMobile && (
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
      )}

      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 80 : 200,
          transition: "margin-left 0.2s",
        }}
      >
        <Header
          style={{
            padding: isMobile ? "0 12px" : "0 20px",
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
            {!isMobile && (
              <SidebarToggle collapsed={collapsed} onClick={() => setCollapsed(!collapsed)} />
            )}
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>
              {ROUTE_TITLES[route]}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {headerActions}
          </div>
        </Header>
        <Content
          style={{
            margin: isMobile ? 12 : 20,
            minHeight: 280,
            paddingBottom: isMobile ? 64 : 0,
          }}
        >
          {route === "dashboard" && <DashboardPage navigate={navigate} />}
          {route === "volunteers" && <VolunteersPage setHeaderActions={setHeaderActions} />}
          {route === "cycles" && <CyclesPage setHeaderActions={setHeaderActions} />}
          {route === "candidates" && <CandidatesPage setHeaderActions={setHeaderActions} />}
          {route === "votes" && <VotesPage setHeaderActions={setHeaderActions} />}
          {route === "races" && <RacesPage setHeaderActions={setHeaderActions} />}
          {route === "ballot-measures" && <BallotMeasuresPage setHeaderActions={setHeaderActions} />}
          {route === "calendar-events" && <CalendarEventsPage setHeaderActions={setHeaderActions} />}
          {route === "fec" && <FecPage setHeaderActions={setHeaderActions} />}
          {route === "automation" && <AutomationPage setHeaderActions={setHeaderActions} />}
          {route === "states" && <StatesPage setHeaderActions={setHeaderActions} />}
          {route === "setup-guide" && <SetupGuidePage navigate={navigate} />}
        </Content>
      </Layout>

      {/* Mobile bottom nav */}
      {isMobile && (
        <>
          <nav
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              height: 56,
              background: "#1E293B",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              zIndex: 100,
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {BOTTOM_NAV_ITEMS.map((item) => {
              const isActive = route === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  aria-label={item.label}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: isActive ? "#F59E0B" : "rgba(255,255,255,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    padding: "6px 0",
                    cursor: "pointer",
                    fontSize: 18,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {item.icon}
                  <span style={{ fontSize: 10, lineHeight: 1, whiteSpace: "nowrap" }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => setMoreOpen(true)}
              aria-label="More"
              style={{
                border: "none",
                background: "transparent",
                color: !BOTTOM_NAV_KEYS.has(route) ? "#F59E0B" : "rgba(255,255,255,0.5)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "6px 0",
                cursor: "pointer",
                fontSize: 18,
                flex: 1,
                minWidth: 0,
              }}
            >
              <EllipsisOutlined />
              <span style={{ fontSize: 10, lineHeight: 1 }}>More</span>
            </button>
          </nav>

          {/* More drawer */}
          <Drawer
            title="Menu"
            placement="bottom"
            open={moreOpen}
            onClose={() => setMoreOpen(false)}
            height="auto"
            styles={{ body: { padding: 0 } }}
          >
            <Menu
              mode="vertical"
              selectedKeys={[route]}
              items={[
                ...moreMenuItems,
                { type: "divider" as const },
                { key: "setup-guide", icon: <BookOutlined />, label: "Setup Guide" },
              ]}
              onClick={({ key }) => handleNavClick(key as AdminRoute)}
              style={{ border: "none" }}
            />
            <div style={{ padding: "8px 16px", borderTop: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "#1E293B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  {(user.email?.[0] ?? "A").toUpperCase()}
                </div>
                <Text style={{ fontSize: 12, color: "#64748b" }}>{user.email}</Text>
              </div>
              <Button
                type="text"
                danger
                icon={<LogoutOutlined />}
                onClick={() => signOut()}
                size="small"
                block
                style={{ textAlign: "left" }}
              >
                Sign Out
              </Button>
            </div>
          </Drawer>
        </>
      )}
    </Layout>
  );
}
