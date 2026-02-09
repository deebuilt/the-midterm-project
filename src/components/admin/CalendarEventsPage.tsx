import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  Table,
  Tag,
  Spin,
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Dropdown,
} from "antd";
import { PlusOutlined, MoreOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../../lib/supabase";

interface CalendarEventRow {
  id: number;
  cycle_id: number;
  state_id: number;
  event_type: string;
  event_date: string;
  title: string;
  description: string | null;
  source_url: string | null;
  state?: { name: string; abbr: string };
}

interface StateOption {
  id: number;
  name: string;
  abbr: string;
}

interface CycleOption {
  id: number;
  name: string;
  year: number;
  is_active: boolean;
}

interface CalendarEventsPageProps {
  setHeaderActions: (actions: ReactNode) => void;
}

const eventTypeOptions = [
  { value: "primary", label: "Primary Election" },
  { value: "runoff", label: "Runoff Election" },
  { value: "general", label: "General Election" },
  { value: "filing_deadline", label: "Filing Deadline" },
  { value: "registration_deadline", label: "Registration Deadline" },
  { value: "early_voting_start", label: "Early Voting Starts" },
  { value: "early_voting_end", label: "Early Voting Ends" },
  { value: "other", label: "Other" },
];

const eventTypeColors: Record<string, string> = {
  primary: "blue",
  runoff: "orange",
  general: "red",
  filing_deadline: "purple",
  registration_deadline: "green",
  early_voting_start: "cyan",
  early_voting_end: "cyan",
  other: "default",
};

export default function CalendarEventsPage({ setHeaderActions }: CalendarEventsPageProps) {
  const [events, setEvents] = useState<CalendarEventRow[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);
  const [cycles, setCycles] = useState<CycleOption[]>([]);
  const [activeCycleId, setActiveCycleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventRow | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterState, setFilterState] = useState<string>("all");
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const load = useCallback(async () => {
    setLoading(true);

    const [cyclesRes, statesRes] = await Promise.all([
      supabase.from("election_cycles").select("*").order("year", { ascending: false }),
      supabase.from("states").select("id, name, abbr").order("name"),
    ]);

    const cycleData = cyclesRes.data ?? [];
    setCycles(cycleData);
    setStates(statesRes.data ?? []);

    const active = cycleData.find((c: CycleOption) => c.is_active);
    const cycleId = active?.id ?? cycleData[0]?.id;
    setActiveCycleId(cycleId);

    if (cycleId) {
      const { data } = await supabase
        .from("calendar_events")
        .select("*, state:states!inner(name, abbr)")
        .eq("cycle_id", cycleId)
        .order("event_date")
        .order("state_id");

      setEvents(data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setHeaderActions(
      <Button
        size="small"
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          setEditingEvent(null);
          form.resetFields();
          if (activeCycleId) form.setFieldValue("cycle_id", activeCycleId);
          setModalOpen(true);
        }}
      >
        Event
      </Button>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions, form, activeCycleId]);

  async function handleSave(values: any) {
    setModalLoading(true);
    const payload = {
      cycle_id: values.cycle_id,
      state_id: values.state_id,
      event_type: values.event_type,
      event_date: values.event_date?.format("YYYY-MM-DD"),
      title: values.title,
      description: values.description || null,
      source_url: values.source_url || null,
    };

    if (editingEvent) {
      const { error } = await supabase
        .from("calendar_events")
        .update(payload)
        .eq("id", editingEvent.id);
      if (error) {
        messageApi.error(error.message);
      } else {
        messageApi.success("Event updated");
        setModalOpen(false);
        load();
      }
    } else {
      const { error } = await supabase.from("calendar_events").insert(payload);
      if (error) {
        messageApi.error(error.message);
      } else {
        messageApi.success("Event created");
        setModalOpen(false);
        form.resetFields();
        load();
      }
    }
    setModalLoading(false);
  }

  async function handleDelete(id: number) {
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error) {
      messageApi.error(error.message);
    } else {
      messageApi.success("Event deleted");
      load();
    }
  }

  function openEdit(record: CalendarEventRow) {
    setEditingEvent(record);
    form.setFieldsValue({
      cycle_id: record.cycle_id,
      state_id: record.state_id,
      event_type: record.event_type,
      event_date: dayjs(record.event_date),
      title: record.title,
      description: record.description,
      source_url: record.source_url,
    });
    setModalOpen(true);
  }

  const filteredEvents = events.filter((ev) => {
    if (filterType !== "all" && ev.event_type !== filterType) return false;
    if (filterState !== "all" && (ev.state as any)?.abbr !== filterState) return false;
    return true;
  });

  const stateFilterOptions = [
    { value: "all", label: "All States" },
    ...states.map((s) => ({ value: s.abbr, label: `${s.name} (${s.abbr})` })),
  ];

  const typeFilterOptions = [
    { value: "all", label: "All Types" },
    ...eventTypeOptions,
  ];

  const columns = [
    {
      title: "State",
      key: "state",
      width: 120,
      render: (_: unknown, record: CalendarEventRow) => (
        <Tag>{(record.state as any)?.abbr ?? "?"}</Tag>
      ),
      sorter: (a: CalendarEventRow, b: CalendarEventRow) =>
        ((a.state as any)?.name ?? "").localeCompare((b.state as any)?.name ?? ""),
    },
    {
      title: "Date",
      dataIndex: "event_date",
      key: "event_date",
      width: 130,
      render: (date: string) => dayjs(date).format("MMM D, YYYY"),
      sorter: (a: CalendarEventRow, b: CalendarEventRow) =>
        a.event_date.localeCompare(b.event_date),
    },
    {
      title: "Type",
      dataIndex: "event_type",
      key: "event_type",
      width: 150,
      render: (type: string) => (
        <Tag color={eventTypeColors[type] ?? "default"}>
          {eventTypeOptions.find((o) => o.value === type)?.label ?? type}
        </Tag>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "",
      key: "actions",
      width: 50,
      render: (_: unknown, record: CalendarEventRow) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                icon: <EditOutlined />,
                label: "Edit",
                onClick: () => openEdit(record),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: "Delete",
                danger: true,
                onClick: () => handleDelete(record.id),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {contextHolder}

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <Select
          value={filterState}
          onChange={setFilterState}
          options={stateFilterOptions}
          style={{ width: 200 }}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
        />
        <Select
          value={filterType}
          onChange={setFilterType}
          options={typeFilterOptions}
          style={{ width: 180 }}
        />
        <span style={{ fontSize: 13, color: "#94A3B8", lineHeight: "32px" }}>
          {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Card style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <Table
          dataSource={filteredEvents}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 25, showSizeChanger: true }}
          size="small"
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editingEvent ? "Edit Calendar Event" : "Add Calendar Event"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingEvent(null);
          form.resetFields();
        }}
        footer={null}
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item
              name="state_id"
              label="State"
              rules={[{ required: true, message: "Required" }]}
              style={{ flex: 1 }}
            >
              <Select
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                options={states.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.abbr})`,
                }))}
                placeholder="Select state..."
              />
            </Form.Item>
            <Form.Item
              name="event_type"
              label="Event Type"
              rules={[{ required: true, message: "Required" }]}
              style={{ flex: 1 }}
            >
              <Select options={eventTypeOptions} placeholder="Select type..." />
            </Form.Item>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item
              name="event_date"
              label="Date"
              rules={[{ required: true, message: "Required" }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: "100%" }} format="MM/DD/YYYY" changeOnBlur needConfirm={false} />
            </Form.Item>
            <Form.Item
              name="cycle_id"
              label="Election Cycle"
              rules={[{ required: true, message: "Required" }]}
              style={{ flex: 1 }}
            >
              <Select
                options={cycles.map((c) => ({
                  value: c.id,
                  label: `${c.name}${c.is_active ? " (Active)" : ""}`,
                }))}
                placeholder="Select cycle..."
              />
            </Form.Item>
          </div>

          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="e.g., Texas Primary Election" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional notes..." />
          </Form.Item>

          <Form.Item name="source_url" label="Source URL">
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={modalLoading} block>
              {editingEvent ? "Update Event" : "Create Event"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
