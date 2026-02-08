import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Checkbox,
  Button,
  Alert,
  ConfigProvider,
  Card,
  Result,
} from "antd";
import { supabase } from "../../lib/supabase";
import { VOLUNTEER_ROLE_LABELS } from "../../lib/database.types";

const { TextArea } = Input;

interface StateOption {
  id: number;
  name: string;
  abbr: string;
}

const roleOptions = Object.entries(VOLUNTEER_ROLE_LABELS).map(
  ([value, label]) => ({ label, value })
);

const theme = {
  token: {
    colorPrimary: "#1E293B",
    borderRadius: 6,
  },
};

export default function VolunteerForm() {
  const [form] = Form.useForm();
  const [states, setStates] = useState<StateOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("states")
      .select("id, name, abbr")
      .order("name")
      .then(({ data }) => setStates(data ?? []));
  }, []);

  async function handleFinish(values: {
    name: string;
    email: string;
    state_id?: number;
    roles?: string[];
    experience?: string;
    availability?: string;
  }) {
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from("volunteers").insert({
      name: values.name,
      email: values.email,
      state_id: values.state_id ?? null,
      roles: values.roles ?? null,
      experience: values.experience ?? null,
      availability: values.availability ?? null,
      status: "pending",
    });

    if (insertError) {
      if (insertError.message.includes("duplicate key")) {
        setError("This email is already registered. We'll be in touch!");
      } else {
        setError("Something went wrong. Please try again.");
      }
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
          title="Thanks for applying!"
          subTitle="We'll review your application and be in touch soon."
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
            label="Full Name"
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
            name="state_id"
            label="Your State"
            rules={[{ required: true, message: "Please select your state" }]}
          >
            <Select
              placeholder="Select your state"
              showSearch
              size="large"
              filterOption={(input, option) =>
                (option?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={states.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.abbr})`,
              }))}
            />
          </Form.Item>

          <Form.Item name="roles" label="What would you like to help with?">
            <Checkbox.Group>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {roleOptions.map((opt) => (
                  <Checkbox key={opt.value} value={opt.value}>
                    {opt.label}
                  </Checkbox>
                ))}
              </div>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item name="experience" label="Relevant Experience">
            <TextArea
              placeholder="Tell us about any relevant experience (optional)"
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item name="availability" label="Availability">
            <TextArea
              placeholder="How many hours per week? Any schedule preferences? (optional)"
              rows={3}
              maxLength={500}
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
              Submit Application
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </ConfigProvider>
  );
}
