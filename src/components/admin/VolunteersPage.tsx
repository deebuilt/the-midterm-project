import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Checkbox,
  Typography,
  Space,
  Drawer,
  Descriptions,
  Card,
  message,
  Spin,
} from "antd";
import { PlusOutlined, MoreOutlined } from "@ant-design/icons";
import { supabase } from "../../lib/supabase";
import {
  VOLUNTEER_ROLE_LABELS,
  type VolunteerRole,
  type VolunteerStatus,
} from "../../lib/database.types";
import { useIsMobile } from "./useIsMobile";

const { Text } = Typography;

interface VolunteerRow {
  id: number;
  name: string;
  email: string;
  status: VolunteerStatus;
  roles: string[] | null;
  experience: string | null;
  availability: string | null;
  interests: string[] | null;
  notes: string | null;
  applied_at: string | null;
  created_at: string;
  state: { name: string; abbr: string } | null;
  state_id: number | null;
}

interface StateOption {
  id: number;
  name: string;
  abbr: string;
}

interface VolunteersPageProps {
  setHeaderActions: (actions: ReactNode) => void;
}

const statusColors: Record<string, string> = {
  active: "green",
  pending: "orange",
  inactive: "default",
};

const roleColors: Record<string, string> = {
  data_research: "blue",
  local_elections: "purple",
  ballot_measures: "cyan",
  content_writing: "green",
  social_media: "magenta",
  community_outreach: "orange",
  translation: "gold",
};

export default function VolunteersPage({ setHeaderActions }: VolunteersPageProps) {
  const [volunteers, setVolunteers] = useState<VolunteerRow[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [detailVolunteer, setDetailVolunteer] = useState<VolunteerRow | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const isMobile = useIsMobile();

  const loadVolunteers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("volunteers")
      .select("*, state:states(name, abbr)")
      .order("created_at", { ascending: false });

    setVolunteers((data as VolunteerRow[]) ?? []);
    setLoading(false);
  }, []);

  const loadStates = useCallback(async () => {
    const { data } = await supabase
      .from("states")
      .select("id, name, abbr")
      .order("name");
    setStates(data ?? []);
  }, []);

  useEffect(() => {
    loadVolunteers();
    loadStates();
  }, [loadVolunteers, loadStates]);

  useEffect(() => {
    setHeaderActions(
      <Button
        size="small"
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setInviteOpen(true)}
      >
        Invite
      </Button>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  async function handleInvite(values: {
    name: string;
    email: string;
    state_id?: number;
    roles?: string[];
  }) {
    setInviteLoading(true);
    const { error } = await supabase.from("volunteers").insert({
      name: values.name,
      email: values.email,
      state_id: values.state_id ?? null,
      roles: values.roles ?? null,
      status: "pending" as VolunteerStatus,
    });

    if (error) {
      messageApi.error(error.message);
    } else {
      messageApi.success("Volunteer invited successfully");
      form.resetFields();
      setInviteOpen(false);
      loadVolunteers();
    }
    setInviteLoading(false);
  }

  async function handleStatusChange(id: number, status: VolunteerStatus) {
    const { error } = await supabase
      .from("volunteers")
      .update({ status })
      .eq("id", id);

    if (error) {
      messageApi.error(error.message);
    } else {
      setVolunteers((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status } : v))
      );
    }
  }

  async function handleStateChange(id: number, stateId: number | null) {
    const { error } = await supabase
      .from("volunteers")
      .update({ state_id: stateId })
      .eq("id", id);

    if (error) {
      messageApi.error(error.message);
    } else {
      const newState = stateId
        ? states.find((s) => s.id === stateId) ?? null
        : null;
      setVolunteers((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, state_id: stateId, state: newState } : v
        )
      );
    }
  }

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: VolunteerRow, b: VolunteerRow) =>
        a.name.localeCompare(b.name),
      render: (name: string, record: VolunteerRow) => (
        <a onClick={() => setDetailVolunteer(record)}>{name}</a>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      responsive: ["md"] as ("md")[],
    },
    {
      title: "State",
      key: "state",
      width: 140,
      render: (_: unknown, record: VolunteerRow) => (
        <Select
          value={record.state_id}
          onChange={(val) => handleStateChange(record.id, val)}
          placeholder="Assign..."
          allowClear
          size="small"
          style={{ width: 120 }}
          options={states.map((s) => ({
            value: s.id,
            label: s.abbr,
          }))}
        />
      ),
    },
    {
      title: "Roles",
      dataIndex: "roles",
      key: "roles",
      responsive: ["lg"] as ("lg")[],
      render: (roles: string[] | null) =>
        roles?.map((r) => (
          <Tag
            key={r}
            color={roleColors[r] ?? "default"}
            style={{ marginBottom: 2 }}
          >
            {VOLUNTEER_ROLE_LABELS[r as VolunteerRole] ?? r}
          </Tag>
        )),
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      filters: [
        { text: "Active", value: "active" },
        { text: "Pending", value: "pending" },
        { text: "Inactive", value: "inactive" },
      ],
      onFilter: (value: unknown, record: VolunteerRow) =>
        record.status === value,
      render: (_: unknown, record: VolunteerRow) => (
        <Select
          value={record.status}
          onChange={(val) => handleStatusChange(record.id, val)}
          size="small"
          style={{ width: 100 }}
          options={[
            { value: "active", label: "Active" },
            { value: "pending", label: "Pending" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      ),
    },
    {
      title: "Applied",
      dataIndex: "created_at",
      key: "created_at",
      responsive: ["md"] as ("md")[],
      sorter: (a: VolunteerRow, b: VolunteerRow) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const roleCheckboxOptions = Object.entries(VOLUNTEER_ROLE_LABELS).map(
    ([value, label]) => ({ label, value })
  );

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const mobileCards = isMobile && (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {volunteers.map((v) => (
        <Card
          key={v.id}
          size="small"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <a
              onClick={() => setDetailVolunteer(v)}
              style={{ fontWeight: 600, fontSize: 14 }}
            >
              {v.name}
            </a>
            <Tag color={statusColors[v.status]}>{v.status}</Tag>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <Select
              value={v.state_id}
              onChange={(val) => handleStateChange(v.id, val)}
              placeholder="State..."
              allowClear
              size="small"
              style={{ width: 90 }}
              options={states.map((s) => ({
                value: s.id,
                label: s.abbr,
              }))}
            />
            <Select
              value={v.status}
              onChange={(val) => handleStatusChange(v.id, val)}
              size="small"
              style={{ width: 100 }}
              options={[
                { value: "active", label: "Active" },
                { value: "pending", label: "Pending" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(v.created_at).toLocaleDateString()}
            </Text>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div>
      {contextHolder}

      {isMobile ? (
        mobileCards
      ) : (
        <Table
          dataSource={volunteers}
          columns={columns}
          rowKey="id"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
          pagination={{ pageSize: 20, showSizeChanger: true }}
        />
      )}

      {/* Invite Modal */}
      <Modal
        title="Invite Volunteer"
        open={inviteOpen}
        onCancel={() => {
          setInviteOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={isMobile ? "100vw" : undefined}
        style={isMobile ? { top: 0, maxWidth: "100vw", margin: 0, paddingBottom: 0 } : undefined}
      >
        <Form form={form} layout="vertical" onFinish={handleInvite}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="Full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="volunteer@example.com" />
          </Form.Item>

          <Form.Item name="state_id" label="Assign to State">
            <Select
              placeholder="Select a state (optional)"
              allowClear
              showSearch
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

          <Form.Item name="roles" label="Roles">
            <Checkbox.Group options={roleCheckboxOptions} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={inviteLoading}
              block
            >
              Send Invite
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title={detailVolunteer?.name ?? "Volunteer Details"}
        open={!!detailVolunteer}
        onClose={() => setDetailVolunteer(null)}
        width={isMobile ? "100%" : 480}
      >
        {detailVolunteer && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Email">
              {detailVolunteer.email}
            </Descriptions.Item>
            <Descriptions.Item label="State">
              {detailVolunteer.state
                ? `${detailVolunteer.state.name} (${detailVolunteer.state.abbr})`
                : "Unassigned"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[detailVolunteer.status]}>
                {detailVolunteer.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Roles">
              {detailVolunteer.roles?.length ? (
                detailVolunteer.roles.map((r) => (
                  <Tag key={r} color={roleColors[r] ?? "default"}>
                    {VOLUNTEER_ROLE_LABELS[r as VolunteerRole] ?? r}
                  </Tag>
                ))
              ) : (
                <Text type="secondary">None</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Experience">
              {detailVolunteer.experience || (
                <Text type="secondary">Not provided</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Availability">
              {detailVolunteer.availability || (
                <Text type="secondary">Not provided</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Notes">
              {detailVolunteer.notes || (
                <Text type="secondary">None</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Applied">
              {detailVolunteer.applied_at
                ? new Date(detailVolunteer.applied_at).toLocaleDateString()
                : new Date(detailVolunteer.created_at).toLocaleDateString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
