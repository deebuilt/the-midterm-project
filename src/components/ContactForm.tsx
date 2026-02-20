import { useState } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Alert,
  ConfigProvider,
  Card,
  Result,
} from "antd";
import { supabase } from "../lib/supabase";
import { CONTACT_SUBJECT_LABELS } from "../lib/database.types";
import type { ContactSubject } from "../lib/database.types";

const { TextArea } = Input;

const subjectOptions = Object.entries(CONTACT_SUBJECT_LABELS).map(
  ([value, label]) => ({ label, value })
);

const theme = {
  token: {
    colorPrimary: "#1E293B",
    borderRadius: 6,
  },
};

export default function ContactForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinish(values: {
    name: string;
    email: string;
    subject: ContactSubject;
    message: string;
  }) {
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase
      .from("contact_messages")
      .insert({
        name: values.name,
        email: values.email,
        subject: values.subject,
        message: values.message,
      });

    if (insertError) {
      setError("Something went wrong. Please try again.");
    } else {
      setSubmitted(true);
    }
    setLoading(false);
  }

  if (submitted) {
    return (
      <ConfigProvider theme={theme}>
        <Result
          status="success"
          title="Message sent!"
          subTitle="Thanks for reaching out. We'll get back to you if a response is needed."
          extra={
            <Button type="primary" href="/">
              Back to Home
            </Button>
          }
        />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={theme}>
      <Card
        style={{
          maxWidth: 560,
          margin: "0 auto",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
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

        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            name="name"
            label="Your Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="Your name" size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="you@example.com" size="large" />
          </Form.Item>

          <Form.Item
            name="subject"
            label="What's this about?"
            rules={[{ required: true, message: "Please select a subject" }]}
          >
            <Select
              placeholder="Select a subject"
              size="large"
              options={subjectOptions}
            />
          </Form.Item>

          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true, message: "Please enter a message" }]}
          >
            <TextArea
              placeholder="What's on your mind?"
              rows={5}
              maxLength={2000}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Send Message
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </ConfigProvider>
  );
}
