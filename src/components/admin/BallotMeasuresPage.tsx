import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Typography,
  Space,
  Drawer,
  Upload,
  Popconfirm,
  Tooltip,
  Dropdown,
  message,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { supabase } from "../../lib/supabase";
import {
  BALLOT_MEASURE_STATUS_LABELS,
  BALLOT_MEASURE_CATEGORY_LABELS,
  type BallotMeasureStatus,
  type BallotMeasureCategory,
} from "../../lib/database.types";

const { Text } = Typography;
const { TextArea } = Input;

interface BallotMeasureRow {
  id: number;
  cycle_id: number;
  state_id: number;
  title: string;
  slug: string;
  short_title: string | null;
  description: string;
  category: BallotMeasureCategory;
  yes_means: string | null;
  no_means: string | null;
  status: BallotMeasureStatus;
  election_date: string | null;
  source_url: string | null;
  sort_order: number;
  state: { name: string; abbr: string };
}

interface StateOption {
  id: number;
  name: string;
  abbr: string;
}

interface CycleOption {
  id: number;
  name: string;
  is_active: boolean;
}

interface CsvRow {
  state_abbr: string;
  title: string;
  short_title?: string;
  description: string;
  category?: string;
  yes_means?: string;
  no_means?: string;
  status?: string;
  source_url?: string;
}

interface BallotMeasuresPageProps {
  setHeaderActions: (actions: ReactNode) => void;
}

const statusColors: Record<string, string> = {
  proposed: "orange",
  qualified: "green",
  passed: "blue",
  failed: "red",
  withdrawn: "default",
};

const categoryColors: Record<string, string> = {
  constitutional_amendment: "purple",
  statute: "blue",
  bond: "green",
  veto_referendum: "orange",
  initiative: "cyan",
  legislative_referral: "gold",
  other: "default",
};

const statusOptions = Object.entries(BALLOT_MEASURE_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

const categoryOptions = Object.entries(BALLOT_MEASURE_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label })
);

function slugifyMeasure(stateAbbr: string, title: string): string {
  return `${stateAbbr}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ""));
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length < 3) continue;

    const row: any = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim() ?? "";
    });

    if (row.state_abbr && row.title && row.description) {
      rows.push(row as CsvRow);
    }
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export default function BallotMeasuresPage({ setHeaderActions }: BallotMeasuresPageProps) {
  const [measures, setMeasures] = useState<BallotMeasureRow[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);
  const [cycles, setCycles] = useState<CycleOption[]>([]);
  const [activeCycleId, setActiveCycleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingMeasure, setEditingMeasure] = useState<BallotMeasureRow | null>(null);
  const [previewMeasure, setPreviewMeasure] = useState<BallotMeasureRow | null>(null);
  const [filterState, setFilterState] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [importOpen, setImportOpen] = useState(false);
  const [importData, setImportData] = useState<CsvRow[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const loadData = useCallback(async () => {
    setLoading(true);

    const [cycleRes, stateRes] = await Promise.all([
      supabase.from("election_cycles").select("id, name, is_active").order("year", { ascending: false }),
      supabase.from("states").select("id, name, abbr").order("name"),
    ]);

    const cycleData = (cycleRes.data ?? []) as CycleOption[];
    setCycles(cycleData);
    setStates(stateRes.data ?? []);

    const active = cycleData.find((c) => c.is_active);
    const cycleId = active?.id ?? cycleData[0]?.id;
    if (cycleId) {
      setActiveCycleId(cycleId);
      await loadMeasures(cycleId);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadMeasures(cycleId: number) {
    setLoading(true);
    const { data, error } = await supabase
      .from("ballot_measures")
      .select("*, state:states!inner(name, abbr)")
      .eq("cycle_id", cycleId)
      .order("state_id")
      .order("sort_order");

    if (error) {
      console.warn(`Ballot measures unavailable: ${error.message}`);
      setMeasures([]);
    } else {
      setMeasures((data as BallotMeasureRow[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setHeaderActions(
      <div style={{ display: "flex", gap: 6 }}>
        <Button size="small" icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
          Import
        </Button>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Measure
        </Button>
      </div>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  function openCreateModal() {
    setEditingMeasure(null);
    form.resetFields();
    form.setFieldValue("cycle_id", activeCycleId);
    form.setFieldValue("category", "initiative");
    form.setFieldValue("status", "proposed");
    form.setFieldValue("sort_order", 0);
    setModalOpen(true);
  }

  function openEditModal(record: BallotMeasureRow) {
    setEditingMeasure(record);
    form.setFieldsValue({
      state_id: record.state_id,
      cycle_id: record.cycle_id,
      title: record.title,
      slug: record.slug,
      short_title: record.short_title ?? "",
      category: record.category,
      description: record.description,
      yes_means: record.yes_means ?? "",
      no_means: record.no_means ?? "",
      status: record.status,
      source_url: record.source_url ?? "",
      sort_order: record.sort_order,
    });
    setModalOpen(true);
  }

  async function handleSave(values: any) {
    setModalLoading(true);
    const payload = {
      state_id: values.state_id,
      cycle_id: values.cycle_id,
      title: values.title,
      slug: values.slug,
      short_title: values.short_title || null,
      category: values.category,
      description: values.description,
      yes_means: values.yes_means || null,
      no_means: values.no_means || null,
      status: values.status,
      election_date: null,
      source_url: values.source_url || null,
      sort_order: values.sort_order ?? 0,
    };

    if (editingMeasure) {
      const { error } = await supabase
        .from("ballot_measures")
        .update(payload)
        .eq("id", editingMeasure.id);
      if (error) {
        messageApi.error(error.message);
      } else {
        messageApi.success("Ballot measure updated");
        setModalOpen(false);
        if (activeCycleId) loadMeasures(activeCycleId);
      }
    } else {
      const { error } = await supabase.from("ballot_measures").insert(payload);
      if (error) {
        messageApi.error(error.message);
      } else {
        messageApi.success("Ballot measure created");
        form.resetFields();
        setModalOpen(false);
        if (activeCycleId) loadMeasures(activeCycleId);
      }
    }
    setModalLoading(false);
  }

  async function handleDelete(id: number) {
    const { error } = await supabase.from("ballot_measures").delete().eq("id", id);
    if (error) {
      messageApi.error(error.message);
    } else {
      messageApi.success("Ballot measure deleted");
      if (activeCycleId) loadMeasures(activeCycleId);
    }
  }

  // CSV Import
  function handleFileUpload(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCsv(text);
      if (rows.length === 0) {
        messageApi.error("No valid rows found. Ensure CSV has state_abbr, title, description columns.");
        return;
      }
      setImportData(rows);
    };
    reader.readAsText(file);
    return false;
  }

  async function handleImport() {
    if (!activeCycleId || importData.length === 0) return;
    setImportLoading(true);

    const stateMap = new Map(states.map((s) => [s.abbr.toUpperCase(), s.id]));
    let errorCount = 0;

    const payloads = importData
      .map((row) => {
        const stateId = stateMap.get(row.state_abbr.toUpperCase());
        if (!stateId) {
          errorCount++;
          return null;
        }
        return {
          cycle_id: activeCycleId,
          state_id: stateId,
          title: row.title,
          slug: slugifyMeasure(row.state_abbr, row.title),
          short_title: row.short_title || null,
          description: row.description,
          category: row.category || "initiative",
          yes_means: row.yes_means || null,
          no_means: row.no_means || null,
          status: row.status || "proposed",
          source_url: row.source_url || null,
          sort_order: 0,
        };
      })
      .filter(Boolean);

    if (payloads.length > 0) {
      const { error } = await supabase.from("ballot_measures").insert(payloads as any[]);
      if (error) {
        messageApi.error(`Import failed: ${error.message}`);
      } else {
        messageApi.success(`Imported ${payloads.length} measures${errorCount > 0 ? `, ${errorCount} skipped (bad state)` : ""}`);
        setImportOpen(false);
        setImportData([]);
        loadMeasures(activeCycleId);
      }
    } else {
      messageApi.error("No valid rows to import (all had unrecognized state abbreviations)");
    }

    setImportLoading(false);
  }

  // Filter
  const filteredMeasures = measures.filter((m) => {
    if (filterState !== "all" && (m.state as any).abbr !== filterState) return false;
    if (filterStatus !== "all" && m.status !== filterStatus) return false;
    return true;
  });

  const columns = [
    {
      title: "State",
      key: "state",
      width: 70,
      sorter: (a: BallotMeasureRow, b: BallotMeasureRow) =>
        (a.state as any).abbr.localeCompare((b.state as any).abbr),
      render: (_: unknown, record: BallotMeasureRow) => (
        <Tag>{(record.state as any).abbr}</Tag>
      ),
    },
    {
      title: "Title",
      key: "title",
      render: (_: unknown, record: BallotMeasureRow) => (
        <div>
          <a onClick={() => setPreviewMeasure(record)}>{record.title}</a>
          {record.short_title && (
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              {record.short_title}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      responsive: ["lg"] as ("lg")[],
      render: (cat: BallotMeasureCategory) => (
        <Tag color={categoryColors[cat] ?? "default"}>
          {BALLOT_MEASURE_CATEGORY_LABELS[cat] ?? cat}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: BallotMeasureStatus) => (
        <Tag color={statusColors[status] ?? "default"}>
          {BALLOT_MEASURE_STATUS_LABELS[status] ?? status}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 48,
      render: (_: unknown, record: BallotMeasureRow) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "preview",
                icon: <EyeOutlined />,
                label: "Preview",
                onClick: () => setPreviewMeasure(record),
              },
              {
                key: "edit",
                icon: <EditOutlined />,
                label: "Edit",
                onClick: () => openEditModal(record),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: "Delete",
                danger: true,
                onClick: () => {
                  Modal.confirm({
                    title: "Delete this ballot measure?",
                    okText: "Delete",
                    okType: "danger",
                    onOk: () => handleDelete(record.id),
                  });
                },
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

      <Text type="secondary" style={{ display: "block", marginBottom: 12, fontSize: 13 }}>
        All non-withdrawn ballot measures appear on the <strong>Map</strong> page in the ballot panel.
        Only measures for the active election cycle are shown publicly.
      </Text>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Select
          value={filterState}
          onChange={setFilterState}
          style={{ width: 160 }}
          size="small"
          showSearch
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          options={[
            { value: "all", label: "All States" },
            ...states.map((s) => ({ value: s.abbr, label: `${s.name} (${s.abbr})` })),
          ]}
        />
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          style={{ width: 140 }}
          size="small"
          options={[
            { value: "all", label: "All Statuses" },
            ...statusOptions,
          ]}
        />
        <Text type="secondary" style={{ fontSize: 13 }}>
          {filteredMeasures.length} measure{filteredMeasures.length !== 1 ? "s" : ""}
        </Text>
      </div>

      {/* Table */}
      <Table
        dataSource={filteredMeasures}
        columns={columns}
        rowKey="id"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />

      {/* Create / Edit Modal */}
      <Modal
        title={editingMeasure ? "Edit Ballot Measure" : "Add Ballot Measure"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={640}
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
                placeholder="Select state..."
                filterOption={(input, option) =>
                  (option?.label as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={states.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.abbr})`,
                }))}
                onChange={(stateId) => {
                  const state = states.find((s) => s.id === stateId);
                  const title = form.getFieldValue("title") ?? "";
                  if (state && title) {
                    form.setFieldValue("slug", slugifyMeasure(state.abbr, title));
                  }
                }}
              />
            </Form.Item>
            <Form.Item name="cycle_id" label="Cycle" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select
                options={cycles.map((c) => ({
                  value: c.id,
                  label: `${c.name}${c.is_active ? " (Active)" : ""}`,
                }))}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="title"
            label="Official Title"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input
              placeholder="e.g., Proposition 1"
              onChange={(e) => {
                const stateId = form.getFieldValue("state_id");
                const state = states.find((s) => s.id === stateId);
                if (state) {
                  form.setFieldValue("slug", slugifyMeasure(state.abbr, e.target.value));
                }
              }}
            />
          </Form.Item>

          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item
              name="slug"
              label={
                <span>
                  Slug{" "}
                  <Tooltip title="URL-friendly identifier, auto-generated from state and title. Used internally for unique identification.">
                    <InfoCircleOutlined style={{ color: "#999" }} />
                  </Tooltip>
                </span>
              }
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="auto-generated" disabled={!editingMeasure} />
            </Form.Item>
            <Form.Item name="short_title" label="Common Name" style={{ flex: 1 }}>
              <Input placeholder="e.g., Reproductive Rights Amendment" />
            </Form.Item>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item name="category" label="Category" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={categoryOptions} />
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={statusOptions} />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Required" }]}
          >
            <TextArea rows={3} placeholder="What this measure does..." />
          </Form.Item>

          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item name="yes_means" label="A YES vote means..." style={{ flex: 1 }}>
              <TextArea rows={2} placeholder="What happens if voters approve" />
            </Form.Item>
            <Form.Item name="no_means" label="A NO vote means..." style={{ flex: 1 }}>
              <TextArea rows={2} placeholder="What happens if voters reject" />
            </Form.Item>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item name="source_url" label="Source URL" style={{ flex: 1 }}>
              <Input placeholder="https://ballotpedia.org/..." />
            </Form.Item>
            <Form.Item name="sort_order" label="Sort Order" style={{ width: 100 }}>
              <InputNumber min={0} />
            </Form.Item>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={modalLoading} block>
              {editingMeasure ? "Save Changes" : "Create Ballot Measure"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        title="Import Ballot Measures from CSV"
        open={importOpen}
        onCancel={() => {
          setImportOpen(false);
          setImportData([]);
        }}
        footer={
          importData.length > 0 ? (
            <Space>
              <Button onClick={() => { setImportOpen(false); setImportData([]); }}>
                Cancel
              </Button>
              <Button type="primary" onClick={handleImport} loading={importLoading}>
                Import {importData.length} Measure{importData.length !== 1 ? "s" : ""}
              </Button>
            </Space>
          ) : null
        }
        width={700}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>
            Upload a CSV file with these columns:{" "}
            <Text code>state_abbr, title, short_title, description, category, yes_means, no_means, status, source_url</Text>
          </Text>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Required: state_abbr, title, description. All other columns are optional.
              Category defaults to "initiative", status defaults to "proposed".
            </Text>
          </div>
        </div>

        <Upload.Dragger
          accept=".csv"
          showUploadList={false}
          beforeUpload={handleFileUpload}
          style={{ marginBottom: 16 }}
        >
          <p style={{ fontSize: 14, color: "#666" }}>
            Click or drag CSV file here
          </p>
        </Upload.Dragger>

        {importData.length > 0 && (
          <div>
            <Text strong>Preview ({importData.length} rows)</Text>
            <Table
              dataSource={importData.map((row, i) => ({ ...row, key: i }))}
              size="small"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 600 }}
              style={{ marginTop: 8 }}
              columns={[
                { title: "State", dataIndex: "state_abbr", key: "state_abbr", width: 60 },
                { title: "Title", dataIndex: "title", key: "title", width: 160 },
                {
                  title: "Description",
                  dataIndex: "description",
                  key: "description",
                  ellipsis: true,
                },
                { title: "Category", dataIndex: "category", key: "category", width: 100 },
                { title: "Status", dataIndex: "status", key: "status", width: 80 },
              ]}
            />
          </div>
        )}
      </Modal>

      {/* Preview Drawer */}
      <Drawer
        title={previewMeasure?.title ?? "Ballot Measure Preview"}
        open={!!previewMeasure}
        onClose={() => setPreviewMeasure(null)}
        width={480}
      >
        {previewMeasure && (
          <div>
            {/* Ballot-style header */}
            <div
              style={{
                background: "#000",
                color: "#fff",
                padding: "8px 16px",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                borderRadius: "4px 4px 0 0",
              }}
            >
              Ballot Measures — {(previewMeasure.state as any).name}
            </div>

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderTop: "none",
                borderRadius: "0 0 8px 8px",
                padding: 20,
              }}
            >
              {/* Title */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {previewMeasure.title}
                </div>
                {previewMeasure.short_title && (
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                    {previewMeasure.short_title}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div style={{ marginBottom: 12 }}>
                <Tag color={categoryColors[previewMeasure.category]}>
                  {BALLOT_MEASURE_CATEGORY_LABELS[previewMeasure.category]}
                </Tag>
                <Tag color={statusColors[previewMeasure.status]}>
                  {BALLOT_MEASURE_STATUS_LABELS[previewMeasure.status]}
                </Tag>
              </div>

              {/* Description */}
              <p style={{ fontSize: 13, color: "#374151", marginBottom: 16 }}>
                {previewMeasure.description}
              </p>

              {/* Yes / No cards */}
              {(previewMeasure.yes_means || previewMeasure.no_means) && (
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  {previewMeasure.yes_means && (
                    <div
                      style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 8,
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#16a34a",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        A YES vote means...
                      </div>
                      <p style={{ fontSize: 12, color: "#374151", margin: 0 }}>
                        {previewMeasure.yes_means}
                      </p>
                    </div>
                  )}
                  {previewMeasure.no_means && (
                    <div
                      style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 8,
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#dc2626",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        A NO vote means...
                      </div>
                      <p style={{ fontSize: 12, color: "#374151", margin: 0 }}>
                        {previewMeasure.no_means}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Source link */}
              {previewMeasure.source_url && (
                <a
                  href={previewMeasure.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12 }}
                >
                  View source
                </a>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
