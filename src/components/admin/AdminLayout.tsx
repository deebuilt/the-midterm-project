import { useState } from "react";
import { Layout, Menu, Button, Typography, theme } from "antd";
import {
  DashboardOutlined,
  TeamOutlined,
  CalendarOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import type { User } from "@supabase/supabase-js";
import type { AdminRoute } from "./AdminApp";
import { signOut } from "../../lib/supabase";
import DashboardPage from "./DashboardPage";
import VolunteersPage from "./VolunteersPage";
import CyclesPage from "./CyclesPage";

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

interface AdminLayoutProps {
  route: AdminRoute;
  navigate: (route: AdminRoute) => void;
  user: User;
}

const menuItems = [
  {
    key: "dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
  },
  {
    key: "volunteers",
    icon: <TeamOutlined />,
    label: "Volunteers",
  },
  {
    key: "cycles",
    icon: <CalendarOutlined />,
    label: "Election Cycles",
  },
];

export default function AdminLayout({ route, navigate, user }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
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
            style={{ color: "white", fontSize: collapsed ? 12 : 16 }}
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
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          {route === "dashboard" && <DashboardPage navigate={navigate} />}
          {route === "volunteers" && <VolunteersPage />}
          {route === "cycles" && <CyclesPage />}
        </Content>
      </Layout>
    </Layout>
  );
}
