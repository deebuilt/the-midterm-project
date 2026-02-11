import { useState } from "react";
import { Card, Form, Input, Button, Alert, Typography, Tabs } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { signIn, sendMagicLink, sendPasswordReset } from "../../lib/supabase";

const { Title, Text, Paragraph } = Typography;

type TabKey = "password" | "magic-link" | "reset-password";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handlePasswordLogin(values: { email: string; password: string }) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await signIn(values.email, values.password);

    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success, LoginFlow will handle redirect
  }

  async function handleMagicLink(values: { email: string }) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await sendMagicLink(values.email);

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Check your email for a magic link to sign in!");
    }
    setLoading(false);
  }

  async function handlePasswordReset(values: { email: string }) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await sendPasswordReset(values.email);

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Password reset link sent! Check your email.");
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
      }}
    >
      <Card
        style={{ width: 450, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
        styles={{
          header: {
            background: "#1E293B",
            borderBottom: "none",
          },
        }}
        title={
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <Title level={4} style={{ color: "white", margin: 0 }}>
              The Midterm Project
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
              Admin Login
            </Text>
          </div>
        }
      >
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {success && (
          <Alert
            message={success}
            type="success"
            showIcon
            closable
            onClose={() => setSuccess(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as TabKey);
            setError(null);
            setSuccess(null);
          }}
          items={[
            {
              key: "password",
              label: "Password",
              children: (
                <Form layout="vertical" onFinish={handlePasswordLogin} autoComplete="off">
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Please enter your email" },
                      { type: "email", message: "Please enter a valid email" },
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="admin@example.com" />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[{ required: true, message: "Please enter your password" }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                      Sign In
                    </Button>
                  </Form.Item>

                  <div style={{ textAlign: "center" }}>
                    <Button type="link" onClick={() => setActiveTab("reset-password")} style={{ padding: 0 }}>
                      Forgot password?
                    </Button>
                  </div>
                </Form>
              ),
            },
            {
              key: "magic-link",
              label: "Magic Link",
              children: (
                <div>
                  <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
                    Enter your email and we'll send you a magic link to sign in.
                  </Paragraph>
                  <Form layout="vertical" onFinish={handleMagicLink} autoComplete="off">
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { required: true, message: "Please enter your email" },
                        { type: "email", message: "Please enter a valid email" },
                      ]}
                    >
                      <Input prefix={<MailOutlined />} placeholder="admin@example.com" />
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading} block>
                        Send Magic Link
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              ),
            },
            {
              key: "reset-password",
              label: "Reset Password",
              children: (
                <div>
                  <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
                    Enter your email and we'll send you a link to reset your password.
                  </Paragraph>
                  <Form layout="vertical" onFinish={handlePasswordReset} autoComplete="off">
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { required: true, message: "Please enter your email" },
                        { type: "email", message: "Please enter a valid email" },
                      ]}
                    >
                      <Input prefix={<MailOutlined />} placeholder="admin@example.com" />
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading} block>
                        Send Reset Link
                      </Button>
                    </Form.Item>

                    <div style={{ textAlign: "center" }}>
                      <Button type="link" onClick={() => setActiveTab("password")} style={{ padding: 0 }}>
                        Back to login
                      </Button>
                    </div>
                  </Form>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
