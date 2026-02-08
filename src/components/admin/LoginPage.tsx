import { useState } from "react";
import { Card, Form, Input, Button, Alert, Typography } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { signIn } from "../../lib/supabase";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinish(values: { email: string; password: string }) {
    setLoading(true);
    setError(null);
    const { error } = await signIn(values.email, values.password);
    if (error) {
      setError(error.message);
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
        style={{ width: 400, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
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
              Admin Panel
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

        <Form layout="vertical" onFinish={handleFinish} autoComplete="off">
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
        </Form>
      </Card>
    </div>
  );
}
