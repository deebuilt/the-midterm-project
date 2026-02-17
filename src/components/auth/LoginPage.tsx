import { useState } from "react";
import { Card, Form, Input, Button, Alert, Typography } from "antd";
import { LockOutlined, MailOutlined, HomeOutlined } from "@ant-design/icons";
import { signIn, sendPasswordReset } from "../../lib/supabase";

const { Title, Text } = Typography;

export default function LoginPage() {
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

  async function handleForgotPassword() {
    const email = (document.querySelector('input[type="text"]') as HTMLInputElement)?.value;
    if (!email) {
      setError("Enter your email above, then click Forgot password.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await sendPasswordReset(email);

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

          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 4 }}>
            <Button type="link" onClick={handleForgotPassword} style={{ padding: 0 }}>
              Forgot password?
            </Button>
            <a href="/" style={{ fontSize: 13, color: "#64748b" }}>
              <HomeOutlined style={{ marginRight: 4 }} />
              Back to main site
            </a>
          </div>
        </Form>
      </Card>
    </div>
  );
}
