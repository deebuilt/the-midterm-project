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
  Tabs,
  Avatar,
  Popconfirm,
  Tooltip,
  Divider,
  Dropdown,
  message,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { supabase } from "../../lib/supabase";
import type { Party, Stance } from "../../lib/database.types";

const { Text } = Typography;
const { TextArea } = Input;

interface CandidateRow {
  id: number;
  slug: string;
  first_name: string;
  last_name: string;
  party: Party;
  photo_url: string | null;
  website: string | null;
  twitter: string | null;
  bio: string | null;
  role_title: string | null;
  is_incumbent: boolean;
  bioguide_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CandidatePosition {
  id: number;
  topic_id: number;
  topic_name: string;
  stance: Stance;
  summary: string;
  source_url: string | null;
}

interface CandidateRaceInfo {
  race_id: number;
  cycle_name: string;
  state_name: string;
  state_abbr: string;
  body_name: string;
  rating: string | null;
  status: string;
  is_incumbent: boolean;
}

interface TopicOption {
  id: number;
  name: string;
}

interface CandidatesPageProps {
  setHeaderActions: (actions: ReactNode) => void;
}

const partyColors: Record<string, string> = {
  Democrat: "blue",
  Republican: "red",
  Independent: "purple",
  Libertarian: "gold",
  Green: "green",
  Other: "default",
};

const stanceColors: Record<string, string> = {
  supports: "green",
  opposes: "red",
  mixed: "orange",
  unknown: "default",
};

const partyOptions: { value: Party; label: string }[] = [
  { value: "Democrat", label: "Democrat" },
  { value: "Republican", label: "Republican" },
  { value: "Independent", label: "Independent" },
  { value: "Libertarian", label: "Libertarian" },
  { value: "Green", label: "Green" },
  { value: "Other", label: "Other" },
];

const stanceOptions: { value: Stance; label: string }[] = [
  { value: "supports", label: "Supports" },
  { value: "opposes", label: "Opposes" },
  { value: "mixed", label: "Mixed" },
  { value: "unknown", label: "Unknown" },
];

function slugify(first: string, last: string): string {
  return `${last}-${first}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function CandidatesPage({ setHeaderActions }: CandidatesPageProps) {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CandidateRow | null>(null);
  const [detailCandidate, setDetailCandidate] = useState<CandidateRow | null>(null);
  const [positions, setPositions] = useState<CandidatePosition[]>([]);
  const [races, setRaces] = useState<CandidateRaceInfo[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoError, setPhotoError] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(560);
  const [editingPositionId, setEditingPositionId] = useState<number | null>(null);
  const [editPositionForm] = Form.useForm();
  const [form] = Form.useForm();
  const [positionForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("candidates")
      .select("*")
      .order("last_name");
    setCandidates((data as CandidateRow[]) ?? []);
    setLoading(false);
  }, []);

  const loadTopics = useCallback(async () => {
    const { data } = await supabase.from("topics").select("id, name").order("name");
    setTopics(data ?? []);
  }, []);

  useEffect(() => {
    loadCandidates();
    loadTopics();
  }, [loadCandidates, loadTopics]);

  useEffect(() => {
    setHeaderActions(
      <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
        Candidate
      </Button>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  async function loadCandidateDetails(candidateId: number) {
    setDrawerLoading(true);

    const [posResult, raceResult] = await Promise.all([
      supabase
        .from("candidate_positions")
        .select("id, topic_id, stance, summary, source_url, topic:topics!inner(name)")
        .eq("candidate_id", candidateId),
      supabase
        .from("race_candidates")
        .select(`
          race_id, status, is_incumbent,
          race:races!inner(
            rating,
            cycle:election_cycles!inner(name),
            district:districts!inner(
              state:states!inner(name, abbr),
              body:government_bodies!inner(name)
            )
          )
        `)
        .eq("candidate_id", candidateId),
    ]);

    setPositions(
      (posResult.data ?? []).map((p: any) => ({
        id: p.id,
        topic_id: p.topic_id,
        topic_name: p.topic?.name ?? "Unknown",
        stance: p.stance,
        summary: p.summary,
        source_url: p.source_url,
      }))
    );

    setRaces(
      (raceResult.data ?? []).map((r: any) => ({
        race_id: r.race_id,
        cycle_name: r.race?.cycle?.name ?? "Unknown",
        state_name: r.race?.district?.state?.name ?? "Unknown",
        state_abbr: r.race?.district?.state?.abbr ?? "??",
        body_name: r.race?.district?.body?.name ?? "Unknown",
        rating: r.race?.rating ?? null,
        status: r.status,
        is_incumbent: r.is_incumbent,
      }))
    );

    setDrawerLoading(false);
  }

  function openCreateModal() {
    setEditingCandidate(null);
    form.resetFields();
    setPhotoPreview("");
    setPhotoError(false);
    setModalOpen(true);
  }

  function openEditModal(record: CandidateRow) {
    setEditingCandidate(record);
    form.setFieldsValue({
      first_name: record.first_name,
      last_name: record.last_name,
      slug: record.slug,
      party: record.party,
      photo_url: record.photo_url ?? "",
      website: record.website ?? "",
      twitter: record.twitter ?? "",
      bio: record.bio ?? "",
      role_title: record.role_title ?? "",
      is_incumbent: record.is_incumbent,
      bioguide_id: record.bioguide_id ?? "",
    });
    setPhotoPreview(record.photo_url ?? "");
    setPhotoError(false);
    setModalOpen(true);
  }

  function openDetailDrawer(record: CandidateRow) {
    setDetailCandidate(record);
    loadCandidateDetails(record.id);
  }

  async function handleSave(values: any) {
    setModalLoading(true);
    const payload = {
      first_name: values.first_name,
      last_name: values.last_name,
      slug: values.slug,
      party: values.party,
      photo_url: values.photo_url || null,
      website: values.website || null,
      twitter: values.twitter || null,
      bio: values.bio || null,
      role_title: values.role_title || null,
      is_incumbent: values.is_incumbent ?? false,
      bioguide_id: values.bioguide_id || null,
    };

    if (editingCandidate) {
      const { error } = await supabase
        .from("candidates")
        .update(payload)
        .eq("id", editingCandidate.id);
      if (error) {
        messageApi.error(error.message);
      } else {
        messageApi.success("Candidate updated");
        setModalOpen(false);
        loadCandidates();
      }
    } else {
      const { error } = await supabase.from("candidates").insert(payload);
      if (error) {
        messageApi.error(error.message);
      } else {
        messageApi.success("Candidate created");
        form.resetFields();
        setModalOpen(false);
        loadCandidates();
      }
    }
    setModalLoading(false);
  }

  async function handleDelete(id: number) {
    const { error } = await supabase.from("candidates").delete().eq("id", id);
    if (error) {
      messageApi.error(error.message);
    } else {
      messageApi.success("Candidate deleted");
      loadCandidates();
      if (detailCandidate?.id === id) {
        setDetailCandidate(null);
      }
    }
  }

  async function handleAddPosition(values: any) {
    if (!detailCandidate) return;
    const { error } = await supabase.from("candidate_positions").insert({
      candidate_id: detailCandidate.id,
      topic_id: values.topic_id,
      stance: values.stance,
      summary: values.summary,
      source_url: values.source_url || null,
    });
    if (error) {
      messageApi.error(error.message);
    } else {
      positionForm.resetFields();
      loadCandidateDetails(detailCandidate.id);
    }
  }

  async function handleDeletePosition(positionId: number) {
    const { error } = await supabase
      .from("candidate_positions")
      .delete()
      .eq("id", positionId);
    if (error) {
      messageApi.error(error.message);
    } else if (detailCandidate) {
      loadCandidateDetails(detailCandidate.id);
    }
  }

  function startEditPosition(pos: CandidatePosition) {
    setEditingPositionId(pos.id);
    editPositionForm.setFieldsValue({
      topic_id: pos.topic_id,
      stance: pos.stance,
      summary: pos.summary,
      source_url: pos.source_url ?? "",
    });
  }

  async function handleSavePosition() {
    if (!editingPositionId || !detailCandidate) return;
    const values = editPositionForm.getFieldsValue();
    const { error } = await supabase
      .from("candidate_positions")
      .update({
        topic_id: values.topic_id,
        stance: values.stance,
        summary: values.summary,
        source_url: values.source_url || null,
      })
      .eq("id", editingPositionId);
    if (error) {
      messageApi.error(error.message);
    } else {
      setEditingPositionId(null);
      loadCandidateDetails(detailCandidate.id);
    }
  }

  function handleDrawerResize(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = drawerWidth;
    function onMove(ev: MouseEvent) {
      const newWidth = Math.max(400, Math.min(900, startWidth + (startX - ev.clientX)));
      setDrawerWidth(newWidth);
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  const columns = [
    {
      title: "Photo",
      key: "photo",
      width: 50,
      render: (_: unknown, record: CandidateRow) => (
        <Avatar
          src={record.photo_url || undefined}
          style={{ backgroundColor: record.photo_url ? undefined : "#1E293B" }}
        >
          {record.first_name[0]}
          {record.last_name[0]}
        </Avatar>
      ),
    },
    {
      title: "Name",
      key: "name",
      sorter: (a: CandidateRow, b: CandidateRow) =>
        a.last_name.localeCompare(b.last_name),
      render: (_: unknown, record: CandidateRow) => (
        <a onClick={() => openDetailDrawer(record)}>
          {record.first_name} {record.last_name}
        </a>
      ),
    },
    {
      title: "Party",
      dataIndex: "party",
      key: "party",
      filters: partyOptions.map((p) => ({ text: p.label, value: p.value })),
      onFilter: (value: unknown, record: CandidateRow) => record.party === value,
      render: (party: Party) => (
        <Tag color={partyColors[party] ?? "default"}>{party}</Tag>
      ),
    },
    {
      title: "Role",
      dataIndex: "role_title",
      key: "role_title",
      responsive: ["lg"] as ("lg")[],
      render: (role: string | null) =>
        role || <Text type="secondary">—</Text>,
    },
    {
      title: "Incumbent",
      dataIndex: "is_incumbent",
      key: "is_incumbent",
      width: 90,
      filters: [
        { text: "Yes", value: true },
        { text: "No", value: false },
      ],
      onFilter: (value: unknown, record: CandidateRow) =>
        record.is_incumbent === value,
      render: (val: boolean) =>
        val ? <Tag color="green">Yes</Tag> : <Text type="secondary">No</Text>,
    },
    {
      title: "",
      key: "actions",
      width: 48,
      render: (_: unknown, record: CandidateRow) => (
        <Dropdown
          menu={{
            items: [
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
                    title: "Delete this candidate?",
                    content: "This will also remove their positions and race assignments.",
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

      <Text type="secondary" style={{ display: "block", marginBottom: 16, fontSize: 13 }}>
        Candidates appear on the Senate, Map, and Explore pages when assigned to a race.
      </Text>

      <Table
        dataSource={candidates}
        columns={columns}
        rowKey="id"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />

      {/* Create / Edit Modal */}
      <Modal
        title={editingCandidate ? "Edit Candidate" : "Add Candidate"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setPhotoPreview("");
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item
              name="first_name"
              label="First Name"
              rules={[{ required: true, message: "Required" }]}
              style={{ flex: 1 }}
            >
              <Input
                onChange={(e) => {
                  if (!editingCandidate) {
                    const last = form.getFieldValue("last_name") ?? "";
                    form.setFieldValue("slug", slugify(e.target.value, last));
                  }
                }}
              />
            </Form.Item>
            <Form.Item
              name="last_name"
              label="Last Name"
              rules={[{ required: true, message: "Required" }]}
              style={{ flex: 1 }}
            >
              <Input
                onChange={(e) => {
                  if (!editingCandidate) {
                    const first = form.getFieldValue("first_name") ?? "";
                    form.setFieldValue("slug", slugify(first, e.target.value));
                  }
                }}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="slug"
            label={
              <span>
                Slug{" "}
                <Tooltip title="Used in URLs to identify this candidate. Auto-generated from their name.">
                  <InfoCircleOutlined style={{ color: "#999" }} />
                </Tooltip>
              </span>
            }
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="auto-generated from name" disabled={!editingCandidate} />
          </Form.Item>

          <Form.Item
            name="party"
            label="Party"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select options={partyOptions} />
          </Form.Item>

          <Form.Item name="photo_url" label="Photo URL">
            <Input
              placeholder="https://..."
              onChange={(e) => {
                setPhotoPreview(e.target.value);
                setPhotoError(false);
              }}
            />
          </Form.Item>
          {photoPreview && (
            <div
              style={{
                marginBottom: 16,
                border: "1px solid #d9d9d9",
                borderRadius: 8,
                padding: 8,
                textAlign: "center",
                background: "#fafafa",
              }}
            >
              {!photoError ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{ maxWidth: 120, maxHeight: 160, borderRadius: 4 }}
                  onError={() => setPhotoError(true)}
                />
              ) : (
                <Text type="secondary">Image failed to load</Text>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item name="website" label="Website" style={{ flex: 1 }}>
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item name="twitter" label="Twitter / X" style={{ flex: 1 }}>
              <Input placeholder="handle (without @)" />
            </Form.Item>
          </div>

          <Form.Item name="role_title" label="Current Role">
            <Input placeholder="e.g., Governor of Maine, U.S. Senator" />
          </Form.Item>

          <Form.Item name="bio" label="Bio">
            <TextArea rows={3} placeholder="Brief biography..." />
          </Form.Item>

          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <Form.Item
              name="bioguide_id"
              label={
                <span>
                  Bioguide ID{" "}
                  <Tooltip title="The official Congressional Biographical Directory ID (e.g., C001035). Used to link to official records. Leave blank if not a current member of Congress.">
                    <InfoCircleOutlined style={{ color: "#999" }} />
                  </Tooltip>
                </span>
              }
              style={{ flex: 1 }}
            >
              <Input placeholder="e.g., C001035" />
            </Form.Item>
            <Form.Item
              name="is_incumbent"
              valuePropName="checked"
              label=" "
              style={{ flex: 1, paddingTop: 4 }}
            >
              <Checkbox>Incumbent</Checkbox>
            </Form.Item>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={modalLoading} block>
              {editingCandidate ? "Save Changes" : "Create Candidate"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title={
          detailCandidate
            ? `${detailCandidate.first_name} ${detailCandidate.last_name}`
            : "Candidate Details"
        }
        open={!!detailCandidate}
        onClose={() => { setDetailCandidate(null); setEditingPositionId(null); }}
        width={drawerWidth}
        styles={{ body: { overflowX: "hidden" } }}
      >
        {/* Resize handle */}
        <div
          onMouseDown={handleDrawerResize}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            cursor: "col-resize",
            zIndex: 10,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1E293B20")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        />
        {detailCandidate && (
          <>
            {/* Header card */}
            <div
              style={{
                display: "flex",
                gap: 16,
                padding: 16,
                background: "#fafafa",
                borderRadius: 8,
                marginBottom: 20,
              }}
            >
              <Avatar
                size={72}
                src={detailCandidate.photo_url || undefined}
                style={{
                  backgroundColor: detailCandidate.photo_url ? undefined : "#1E293B",
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {detailCandidate.first_name[0]}
                {detailCandidate.last_name[0]}
              </Avatar>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                  {detailCandidate.first_name} {detailCandidate.last_name}
                </div>
                <div style={{ marginBottom: 6 }}>
                  <Tag color={partyColors[detailCandidate.party]}>
                    {detailCandidate.party}
                  </Tag>
                  {detailCandidate.is_incumbent && (
                    <Tag color="green">Incumbent</Tag>
                  )}
                </div>
                {detailCandidate.role_title && (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {detailCandidate.role_title}
                  </Text>
                )}
                {(detailCandidate.website || detailCandidate.twitter) && (
                  <div style={{ marginTop: 6 }}>
                    <Space size="middle">
                      {detailCandidate.website && (
                        <a href={detailCandidate.website} target="_blank" rel="noopener noreferrer">
                          <LinkOutlined /> Website
                        </a>
                      )}
                      {detailCandidate.twitter && (
                        <a
                          href={`https://x.com/${detailCandidate.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          @{detailCandidate.twitter}
                        </a>
                      )}
                    </Space>
                  </div>
                )}
              </div>
            </div>

            {detailCandidate.bio && (
              <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>{detailCandidate.bio}</p>
            )}

            <Tabs
              items={[
                {
                  key: "positions",
                  label: `Policy Positions (${positions.length})`,
                  children: drawerLoading ? (
                    <Spin />
                  ) : (
                    <div>
                      <Text type="secondary" style={{ display: "block", marginBottom: 12, fontSize: 12 }}>
                        Positions appear on the Explore page swipe cards and candidate profiles.
                      </Text>

                      {/* Add position form */}
                      <div
                        style={{
                          marginBottom: 16,
                          padding: 12,
                          background: "#f8f9fa",
                          borderRadius: 8,
                          border: "1px solid #f0f0f0",
                        }}
                      >
                        <Text strong style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                          Add Position
                        </Text>
                        <Form
                          form={positionForm}
                          onFinish={handleAddPosition}
                          layout="vertical"
                          size="small"
                        >
                          <div style={{ display: "flex", gap: 8 }}>
                            <Form.Item
                              name="topic_id"
                              rules={[{ required: true, message: "Required" }]}
                              style={{ flex: 1, marginBottom: 8 }}
                            >
                              <Select
                                placeholder="Topic"
                                options={topics.map((t) => ({
                                  value: t.id,
                                  label: t.name,
                                }))}
                              />
                            </Form.Item>
                            <Form.Item
                              name="stance"
                              rules={[{ required: true, message: "Required" }]}
                              style={{ width: 110, marginBottom: 8 }}
                            >
                              <Select
                                placeholder="Stance"
                                options={stanceOptions}
                              />
                            </Form.Item>
                          </div>
                          <Form.Item
                            name="summary"
                            rules={[{ required: true, message: "Required" }]}
                            style={{ marginBottom: 8 }}
                          >
                            <Input placeholder="Position summary (shown on public site)" />
                          </Form.Item>
                          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <Form.Item name="source_url" style={{ flex: 1, marginBottom: 0 }}>
                              <Input placeholder="Source URL (optional)" />
                            </Form.Item>
                            <Button
                              type="primary"
                              htmlType="submit"
                              icon={<PlusOutlined />}
                            >
                              Add
                            </Button>
                          </div>
                        </Form>
                      </div>

                      {/* Positions list */}
                      {positions.length === 0 ? (
                        <Text type="secondary">No positions recorded yet.</Text>
                      ) : (
                        <Form form={editPositionForm} component={false}>
                        <div style={{ overflowX: "auto" }}>
                        <Table
                          dataSource={positions}
                          rowKey="id"
                          size="small"
                          pagination={false}
                          tableLayout="fixed"
                          columns={[
                            {
                              title: "Topic",
                              dataIndex: "topic_name",
                              key: "topic_name",
                              width: 120,
                              render: (_: string, record: CandidatePosition) =>
                                editingPositionId === record.id ? (
                                  <Form.Item name="topic_id" style={{ margin: 0 }}>
                                    <Select
                                      size="small"
                                      style={{ width: 110 }}
                                      options={topics.map((t) => ({ value: t.id, label: t.name }))}
                                    />
                                  </Form.Item>
                                ) : record.topic_name,
                            },
                            {
                              title: "Stance",
                              dataIndex: "stance",
                              key: "stance",
                              width: 90,
                              render: (s: Stance, record: CandidatePosition) =>
                                editingPositionId === record.id ? (
                                  <Form.Item name="stance" style={{ margin: 0 }}>
                                    <Select size="small" style={{ width: 80 }} options={stanceOptions} />
                                  </Form.Item>
                                ) : (
                                  <Tag color={stanceColors[s]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Tag>
                                ),
                            },
                            {
                              title: "Summary",
                              dataIndex: "summary",
                              key: "summary",
                              render: (summary: string, record: CandidatePosition) =>
                                editingPositionId === record.id ? (
                                  <Form.Item name="summary" style={{ margin: 0 }}>
                                    <Input size="small" />
                                  </Form.Item>
                                ) : (
                                  <Tooltip title={summary}>
                                    <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {summary}
                                    </span>
                                  </Tooltip>
                                ),
                            },
                            {
                              title: "",
                              key: "actions",
                              width: 64,
                              render: (_: unknown, record: CandidatePosition) =>
                                editingPositionId === record.id ? (
                                  <Space size={4}>
                                    <Button type="link" size="small" onClick={handleSavePosition}>Save</Button>
                                    <Button type="text" size="small" onClick={() => setEditingPositionId(null)}>Cancel</Button>
                                  </Space>
                                ) : (
                                  <Dropdown
                                    menu={{
                                      items: [
                                        { key: "edit", icon: <EditOutlined />, label: "Edit", onClick: () => startEditPosition(record) },
                                        { key: "delete", icon: <DeleteOutlined />, label: "Delete", danger: true, onClick: () => {
                                          Modal.confirm({ title: "Delete this position?", okText: "Delete", okType: "danger", onOk: () => handleDeletePosition(record.id) });
                                        }},
                                      ],
                                    }}
                                    trigger={["click"]}
                                  >
                                    <Button type="text" size="small" icon={<MoreOutlined />} />
                                  </Dropdown>
                                ),
                            },
                          ]}
                        />
                        </div>
                        </Form>
                      )}
                    </div>
                  ),
                },
                {
                  key: "races",
                  label: `Race Assignments (${races.length})`,
                  children: drawerLoading ? (
                    <Spin />
                  ) : (
                    <div>
                      <Text type="secondary" style={{ display: "block", marginBottom: 12, fontSize: 12 }}>
                        Races this candidate is running in. To add or remove race assignments, go to the Races page.
                      </Text>
                      {races.length === 0 ? (
                        <Text type="secondary">
                          Not assigned to any races yet.
                        </Text>
                      ) : (
                        <Table
                          dataSource={races}
                          rowKey="race_id"
                          size="small"
                          pagination={false}
                          columns={[
                            {
                              title: "Cycle",
                              dataIndex: "cycle_name",
                              key: "cycle_name",
                              width: 120,
                            },
                            {
                              title: "State",
                              key: "state",
                              render: (_: unknown, r: CandidateRaceInfo) =>
                                `${r.state_name} (${r.state_abbr})`,
                            },
                            {
                              title: "Body",
                              dataIndex: "body_name",
                              key: "body_name",
                            },
                            {
                              title: "Rating",
                              dataIndex: "rating",
                              key: "rating",
                              render: (rating: string | null) =>
                                rating ? <Tag>{rating}</Tag> : <Text type="secondary">—</Text>,
                            },
                            {
                              title: "Status",
                              dataIndex: "status",
                              key: "status",
                              render: (s: string) => <Tag>{s.charAt(0).toUpperCase() + s.slice(1)}</Tag>,
                            },
                          ]}
                        />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </>
        )}
      </Drawer>
    </div>
  );
}
