import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  Table,
  Tag,
  Badge,
  Typography,
  Spin,
  Card,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../../lib/supabase";
import { useIsMobile } from "./useIsMobile";

const { Text } = Typography;

interface CycleRow {
  id: number;
  name: string;
  year: number;
  election_date: string;
  type: string;
  is_active: boolean;
  description: string | null;
}

interface RaceBreakdown {
  body_name: string;
  count: number;
}

interface CyclesPageProps {
  setHeaderActions: (actions: ReactNode) => void;
}

const typeOptions = [
  { value: "midterm", label: "Midterm" },
  { value: "presidential", label: "Presidential" },
  { value: "special", label: "Special" },
  { value: "primary", label: "Primary" },
  { value: "runoff", label: "Runoff" },
];

export default function CyclesPage({ setHeaderActions }: CyclesPageProps) {
  const [cycles, setCycles] = useState<CycleRow[]>([]);
  const [raceCounts, setRaceCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const isMobile = useIsMobile();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: cycleData } = await supabase
      .from("election_cycles")
      .select("*")
      .order("year", { ascending: false });

    setCycles(cycleData ?? []);

    if (cycleData?.length) {
      const { data: races } = await supabase
        .from("races")
        .select("id, cycle_id");

      const counts: Record<number, number> = {};
      for (const race of races ?? []) {
        counts[race.cycle_id] = (counts[race.cycle_id] ?? 0) + 1;
      }
      setRaceCounts(counts);
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
          form.resetFields();
          form.setFieldValue("is_active", false);
          setModalOpen(true);
        }}
      >
        Cycle
      </Button>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions, form]);

  async function handleSave(values: any) {
    setModalLoading(true);
    const payload = {
      name: values.name,
      year: values.year,
      type: values.type,
      election_date: values.election_date
        ? values.election_date.format("YYYY-MM-DD")
        : null,
      is_active: values.is_active ?? false,
      description: values.description || null,
    };

    const { error } = await supabase.from("election_cycles").insert(payload);
    if (error) {
      messageApi.error(error.message);
    } else {
      messageApi.success("Election cycle created");
      setModalOpen(false);
      form.resetFields();
      load();
    }
    setModalLoading(false);
  }

  const typeColors: Record<string, string> = {
    midterm: "blue",
    presidential: "purple",
    special: "orange",
    primary: "cyan",
    runoff: "gold",
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      sorter: (a: CycleRow, b: CycleRow) => a.year - b.year,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={typeColors[type] ?? "default"}>{type}</Tag>
      ),
    },
    {
      title: "Election Date",
      dataIndex: "election_date",
      key: "election_date",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Status",
      key: "is_active",
      render: (_: unknown, record: CycleRow) =>
        record.is_active ? (
          <Badge status="success" text="Active" />
        ) : (
          <Badge status="default" text="Inactive" />
        ),
    },
    {
      title: "Races",
      key: "races",
      render: (_: unknown, record: CycleRow) => raceCounts[record.id] ?? 0,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const mobileCards = isMobile && (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {cycles.map((c) => (
        <Card key={c.id} size="small" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <Text strong style={{ fontSize: 14 }}>{c.name}</Text>
            {c.is_active ? (
              <Badge status="success" text="Active" />
            ) : (
              <Badge status="default" text="Inactive" />
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{c.year}</Text>
            <Tag color={typeColors[c.type] ?? "default"}>{c.type}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(c.election_date).toLocaleDateString()}
            </Text>
            <Text style={{ fontSize: 12 }}>{raceCounts[c.id] ?? 0} races</Text>
          </div>
          {c.description && (
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
              {c.description}
            </Text>
          )}
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
        <Card style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <Table
            dataSource={cycles}
            columns={columns}
            rowKey="id"
            pagination={false}
            expandable={{
              expandedRowRender: (record) => (
                <CycleDetail cycleId={record.id} description={record.description} />
              ),
            }}
          />
        </Card>
      )}

      {/* Create Modal */}
      <Modal
        title="Add Election Cycle"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={isMobile ? "100vw" : 520}
        style={isMobile ? { top: 0, maxWidth: "100vw", margin: 0, paddingBottom: 0 } : undefined}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="e.g., 2026 Midterm Elections" />
          </Form.Item>

          <div style={{ display: "flex", gap: 16, flexDirection: isMobile ? "column" : "row" }}>
            <Form.Item
              name="year"
              label="Year"
              rules={[{ required: true, message: "Required" }]}
              style={{ flex: 1 }}
            >
              <Input type="number" placeholder="2026" />
            </Form.Item>
            <Form.Item
              name="type"
              label="Type"
              rules={[{ required: true, message: "Required" }]}
              style={{ flex: 1 }}
            >
              <Select options={typeOptions} placeholder="Select type..." />
            </Form.Item>
          </div>

          <Form.Item
            name="election_date"
            label="Election Date"
            rules={[{ required: true, message: "Required" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional notes about this cycle..." />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Set as Active"
            valuePropName="checked"
            extra="Only one cycle can be active at a time. Setting this active will be the default cycle for new races."
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={modalLoading} block>
              Create Cycle
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function CycleDetail({
  cycleId,
  description,
}: {
  cycleId: number;
  description: string | null;
}) {
  const [breakdown, setBreakdown] = useState<{ body_name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("races")
        .select("id, district:districts(body:government_bodies(name))")
        .eq("cycle_id", cycleId);

      const countMap: Record<string, number> = {};
      for (const race of data ?? []) {
        const bodyName =
          (race.district as any)?.body?.name ?? "Unknown";
        countMap[bodyName] = (countMap[bodyName] ?? 0) + 1;
      }

      setBreakdown(
        Object.entries(countMap).map(([body_name, count]) => ({
          body_name,
          count,
        }))
      );
      setLoading(false);
    }

    load();
  }, [cycleId]);

  if (loading) return <Spin size="small" />;

  return (
    <div>
      {description && (
        <p style={{ marginBottom: 12, color: "#666" }}>{description}</p>
      )}
      <Table
        dataSource={breakdown}
        columns={[
          { title: "Body", dataIndex: "body_name", key: "body_name" },
          { title: "Races", dataIndex: "count", key: "count" },
        ]}
        rowKey="body_name"
        pagination={false}
        size="small"
      />
    </div>
  );
}
