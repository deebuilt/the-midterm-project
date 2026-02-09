import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  DatePicker,
  Typography,
  Space,
  Drawer,
  Dropdown,
  Segmented,
  Popconfirm,
  Tooltip,
  message,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../../lib/supabase";
import type { RaceRating, CandidateStatus } from "../../lib/database.types";
import RacePreview from "./RacePreview";

const { Text } = Typography;
const { TextArea } = Input;

interface RaceRow {
  id: number;
  cycle_id: number;
  district_id: number;
  rating: RaceRating | null;
  is_special_election: boolean;
  is_open_seat: boolean;
  primary_date: string | null;
  general_date: string | null;
  why_competitive: string | null;
  district: {
    id: number;
    name: string;
    senate_class: number | null;
    state: { id: number; name: string; abbr: string };
    body: { id: number; name: string; slug: string };
  };
  race_candidates: RaceCandidateRow[];
}

interface RaceCandidateRow {
  id: number;
  candidate_id: number;
  status: CandidateStatus;
  is_incumbent: boolean;
  candidate: {
    id: number;
    slug: string;
    first_name: string;
    last_name: string;
    party: string;
    photo_url: string | null;
    role_title: string | null;
  };
}

interface CycleOption {
  id: number;
  name: string;
  is_active: boolean;
}

interface StateOption {
  id: number;
  name: string;
  abbr: string;
}

interface DistrictOption {
  id: number;
  name: string;
  senate_class: number | null;
  body: { name: string; slug: string };
}

interface CandidateOption {
  id: number;
  first_name: string;
  last_name: string;
  party: string;
}

interface RacesPageProps {
  setHeaderActions: (actions: ReactNode) => void;
}

const RATING_COLORS: Record<string, string> = {
  "Safe D": "#1E40AF",
  "Likely D": "#3B82F6",
  "Lean D": "#93C5FD",
  "Toss-up": "#F59E0B",
  "Lean R": "#FCA5A5",
  "Likely R": "#EF4444",
  "Safe R": "#991B1B",
};

const RATING_TEXT_COLORS: Record<string, string> = {
  "Safe D": "#fff",
  "Likely D": "#fff",
  "Lean D": "#1E293B",
  "Toss-up": "#1E293B",
  "Lean R": "#1E293B",
  "Likely R": "#fff",
  "Safe R": "#fff",
};

const PARTY_DOTS: Record<string, string> = {
  Democrat: "#2563EB",
  Republican: "#DC2626",
  Independent: "#7C3AED",
};

const ratingOptions: { value: RaceRating; label: string }[] = [
  { value: "Safe D", label: "Safe D" },
  { value: "Likely D", label: "Likely D" },
  { value: "Lean D", label: "Lean D" },
  { value: "Toss-up", label: "Toss-up" },
  { value: "Lean R", label: "Lean R" },
  { value: "Likely R", label: "Likely R" },
  { value: "Safe R", label: "Safe R" },
];

const statusOptions: { value: CandidateStatus; label: string }[] = [
  { value: "announced", label: "Announced" },
  { value: "primary_winner", label: "Primary Winner" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "runoff", label: "Runoff" },
];

export default function RacesPage({ setHeaderActions }: RacesPageProps) {
  const [races, setRaces] = useState<RaceRow[]>([]);
  const [cycles, setCycles] = useState<CycleOption[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);
  const [allCandidates, setAllCandidates] = useState<CandidateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCycleId, setActiveCycleId] = useState<number | null>(null);
  const [filterBody, setFilterBody] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingRace, setEditingRace] = useState<RaceRow | null>(null);
  const [previewRace, setPreviewRace] = useState<RaceRow | null>(null);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const loadData = useCallback(async () => {
    setLoading(true);

    const [cycleRes, stateRes, candidateRes] = await Promise.all([
      supabase.from("election_cycles").select("id, name, is_active").order("year", { ascending: false }),
      supabase.from("states").select("id, name, abbr").order("name"),
      supabase.from("candidates").select("id, first_name, last_name, party").order("last_name"),
    ]);

    const cycleData = (cycleRes.data ?? []) as CycleOption[];
    setCycles(cycleData);
    setStates(stateRes.data ?? []);
    setAllCandidates(candidateRes.data ?? []);

    const active = cycleData.find((c) => c.is_active);
    const cycleId = active?.id ?? cycleData[0]?.id;
    if (cycleId) {
      setActiveCycleId(cycleId);
      await loadRaces(cycleId);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadRaces(cycleId: number) {
    setLoading(true);
    const { data } = await supabase
      .from("races")
      .select(`
        *,
        district:districts!inner(
          id, name, senate_class,
          state:states!inner(id, name, abbr),
          body:government_bodies!inner(id, name, slug)
        ),
        race_candidates(
          id, candidate_id, status, is_incumbent,
          candidate:candidates!inner(
            id, slug, first_name, last_name, party, photo_url, role_title
          )
        )
      `)
      .eq("cycle_id", cycleId)
      .order("created_at", { ascending: false });

    setRaces((data as RaceRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setHeaderActions(
      <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
        Race
      </Button>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  async function handleCycleChange(cycleId: number) {
    setActiveCycleId(cycleId);
    await loadRaces(cycleId);
  }

  async function loadDistrictsForState(stateId: number) {
    setSelectedStateId(stateId);
    const { data } = await supabase
      .from("districts")
      .select("id, name, senate_class, body:government_bodies!inner(name, slug)")
      .eq("state_id", stateId)
      .order("name");
    setDistricts((data as unknown as DistrictOption[]) ?? []);
  }

  function openCreateModal() {
    setEditingRace(null);
    form.resetFields();
    form.setFieldValue("cycle_id", activeCycleId);
    setDistricts([]);
    setSelectedStateId(null);
    setModalOpen(true);
  }

  function openEditModal(record: RaceRow) {
    setEditingRace(record);
    form.setFieldsValue({
      cycle_id: record.cycle_id,
      rating: record.rating,
      is_special_election: record.is_special_election,
      is_open_seat: record.is_open_seat,
      primary_date: record.primary_date ? dayjs(record.primary_date) : null,
      general_date: record.general_date ? dayjs(record.general_date) : null,
      why_competitive: record.why_competitive ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave(values: any) {
    setModalLoading(true);
    const payload: Record<string, any> = {
      rating: values.rating ?? null,
      is_special_election: values.is_special_election ?? false,
      is_open_seat: values.is_open_seat ?? false,
      primary_date: values.primary_date ? values.primary_date.format("YYYY-MM-DD") : null,
      general_date: values.general_date ? values.general_date.format("YYYY-MM-DD") : null,
      why_competitive: values.why_competitive || null,
    };

    if (editingRace) {
      const { error } = await supabase
        .from("races")
        .update(payload)
        .eq("id", editingRace.id);
      if (error) {
        messageApi.error(error.message);
      } else {
        messageApi.success("Race updated");
        setModalOpen(false);
        if (activeCycleId) loadRaces(activeCycleId);
      }
    } else {
      payload.cycle_id = values.cycle_id;
      payload.district_id = values.district_id;
      const { error } = await supabase.from("races").insert(payload);
      if (error) {
        messageApi.error(error.message);
      } else {
        messageApi.success("Race created");
        form.resetFields();
        setModalOpen(false);
        if (activeCycleId) loadRaces(activeCycleId);
      }
    }
    setModalLoading(false);
  }

  async function handleDelete(id: number) {
    const { error } = await supabase.from("races").delete().eq("id", id);
    if (error) {
      messageApi.error(error.message);
    } else {
      messageApi.success("Race deleted");
      if (activeCycleId) loadRaces(activeCycleId);
    }
  }

  async function handleInlineRating(raceId: number, newRating: RaceRating) {
    const { error } = await supabase
      .from("races")
      .update({ rating: newRating })
      .eq("id", raceId);
    if (error) {
      messageApi.error(error.message);
    } else {
      setRaces((prev) =>
        prev.map((r) => (r.id === raceId ? { ...r, rating: newRating } : r))
      );
    }
  }

  async function handleAddCandidate(raceId: number, candidateId: number) {
    const { error } = await supabase.from("race_candidates").insert({
      race_id: raceId,
      candidate_id: candidateId,
      status: "announced" as CandidateStatus,
      is_incumbent: false,
    });
    if (error) {
      messageApi.error(error.message);
    } else if (activeCycleId) {
      loadRaces(activeCycleId);
    }
  }

  async function handleRemoveCandidate(raceCandidateId: number) {
    const { error } = await supabase
      .from("race_candidates")
      .delete()
      .eq("id", raceCandidateId);
    if (error) {
      messageApi.error(error.message);
    } else if (activeCycleId) {
      loadRaces(activeCycleId);
    }
  }

  async function handleCandidateStatusChange(
    raceCandidateId: number,
    status: CandidateStatus
  ) {
    const { error } = await supabase
      .from("race_candidates")
      .update({ status })
      .eq("id", raceCandidateId);
    if (error) {
      messageApi.error(error.message);
    } else {
      setRaces((prev) =>
        prev.map((r) => ({
          ...r,
          race_candidates: r.race_candidates.map((rc) =>
            rc.id === raceCandidateId ? { ...rc, status } : rc
          ),
        }))
      );
    }
  }

  async function handleCandidateIncumbentChange(
    raceCandidateId: number,
    is_incumbent: boolean
  ) {
    const { error } = await supabase
      .from("race_candidates")
      .update({ is_incumbent })
      .eq("id", raceCandidateId);
    if (error) {
      messageApi.error(error.message);
    } else {
      setRaces((prev) =>
        prev.map((r) => ({
          ...r,
          race_candidates: r.race_candidates.map((rc) =>
            rc.id === raceCandidateId ? { ...rc, is_incumbent } : rc
          ),
        }))
      );
    }
  }

  // Filter races
  const filteredRaces = races.filter((r) => {
    if (filterBody !== "all" && (r.district as any)?.body?.slug !== filterBody) return false;
    if (filterRating !== "all" && r.rating !== filterRating) return false;
    return true;
  });

  const columns = [
    {
      title: "State",
      key: "state",
      sorter: (a: RaceRow, b: RaceRow) =>
        (a.district as any).state.name.localeCompare((b.district as any).state.name),
      render: (_: unknown, record: RaceRow) => {
        const d = record.district as any;
        return `${d.state.name} (${d.state.abbr})`;
      },
    },
    {
      title: "District",
      key: "district",
      render: (_: unknown, record: RaceRow) => (record.district as any).name,
    },
    {
      title: "Rating",
      key: "rating",
      width: 130,
      render: (_: unknown, record: RaceRow) => (
        <Select
          value={record.rating ?? undefined}
          onChange={(val) => handleInlineRating(record.id, val)}
          size="small"
          style={{ width: 115 }}
          placeholder="Set..."
          options={ratingOptions}
          optionRender={(option) => (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: RATING_COLORS[option.value as string] ?? "#6b7280",
                  display: "inline-block",
                }}
              />
              {option.label}
            </span>
          )}
          labelRender={(props) =>
            props.value ? (
              <span
                style={{
                  background: RATING_COLORS[props.value as string] ?? "#6b7280",
                  color: RATING_TEXT_COLORS[props.value as string] ?? "#fff",
                  padding: "1px 8px",
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {props.label}
              </span>
            ) : (
              <Text type="secondary">—</Text>
            )
          }
        />
      ),
    },
    {
      title: "Candidates",
      key: "candidates",
      responsive: ["md"] as ("md")[],
      render: (_: unknown, record: RaceRow) => (
        <Space size={4} wrap>
          {record.race_candidates.map((rc) => (
            <Tooltip
              key={rc.id}
              title={`${rc.candidate.first_name} ${rc.candidate.last_name} (${rc.candidate.party})`}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: PARTY_DOTS[rc.candidate.party] ?? "#6b7280",
                  display: "inline-block",
                  cursor: "help",
                }}
              />
            </Tooltip>
          ))}
          {record.race_candidates.length === 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              None
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Special",
      dataIndex: "is_special_election",
      key: "special",
      width: 70,
      render: (val: boolean) => (val ? <Tag color="purple">Yes</Tag> : null),
    },
    {
      title: "Open",
      dataIndex: "is_open_seat",
      key: "open",
      width: 70,
      render: (val: boolean) => (val ? <Tag color="orange">Yes</Tag> : null),
    },
    {
      title: "",
      key: "actions",
      width: 48,
      render: (_: unknown, record: RaceRow) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              {
                key: "preview",
                label: "Preview",
                icon: <EyeOutlined />,
                onClick: () => setPreviewRace(record),
              },
              {
                key: "edit",
                label: "Edit",
                icon: <EditOutlined />,
                onClick: () => openEditModal(record),
              },
              { type: "divider" },
              {
                key: "delete",
                label: "Delete",
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () =>
                  Modal.confirm({
                    title: "Delete this race?",
                    content: "This will also remove all candidate assignments.",
                    okText: "Delete",
                    okType: "danger",
                    onOk: () => handleDelete(record.id),
                  }),
              },
            ],
          }}
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
        Changes here affect the <strong>Senate</strong>, <strong>House</strong>, <strong>Map</strong>, and <strong>Explore</strong> pages.
        Ratings determine which section a race appears in (Toss-up, Lean, Likely, Safe).
      </Text>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Segmented
          value={filterBody}
          onChange={(val) => setFilterBody(val as string)}
          options={[
            { value: "all", label: "All" },
            { value: "us-senate", label: "Senate" },
            { value: "us-house", label: "House" },
            { value: "governor", label: "Governor" },
          ]}
        />
        <Select
          value={activeCycleId}
          onChange={handleCycleChange}
          style={{ width: 200 }}
          size="small"
          options={cycles.map((c) => ({
            value: c.id,
            label: `${c.name}${c.is_active ? " (Active)" : ""}`,
          }))}
        />
        <Select
          value={filterRating}
          onChange={setFilterRating}
          style={{ width: 140 }}
          size="small"
          options={[
            { value: "all", label: "All Ratings" },
            ...ratingOptions,
          ]}
        />
      </div>

      {/* Table */}
      <Table
        dataSource={filteredRaces}
        columns={columns}
        rowKey="id"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />

      {/* Create / Edit Modal */}
      <Modal
        title={editingRace ? "Edit Race" : "Add Race"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {!editingRace && (
            <>
              <Form.Item
                name="cycle_id"
                label="Election Cycle"
                rules={[{ required: true }]}
              >
                <Select
                  options={cycles.map((c) => ({
                    value: c.id,
                    label: `${c.name}${c.is_active ? " (Active)" : ""}`,
                  }))}
                />
              </Form.Item>
              <Form.Item label="State" required>
                <Select
                  value={selectedStateId}
                  onChange={(val) => loadDistrictsForState(val)}
                  placeholder="Select state first..."
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
              <Form.Item
                name="district_id"
                label="District"
                rules={[{ required: true, message: "Select a district" }]}
              >
                <Select
                  placeholder={
                    selectedStateId
                      ? "Select district..."
                      : "Select a state first"
                  }
                  disabled={!selectedStateId}
                  options={districts.map((d) => ({
                    value: d.id,
                    label: `${d.name} (${(d.body as any).name})`,
                  }))}
                />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="rating"
            label={
              <span>
                Rating{" "}
                <Tooltip title="Determines how this race is categorized on the public site: Toss-up, Lean, Likely, or Safe.">
                  <InfoCircleOutlined style={{ color: "#999" }} />
                </Tooltip>
              </span>
            }
          >
            <Select
              allowClear
              placeholder="Select rating..."
              options={ratingOptions}
            />
          </Form.Item>

          <div style={{ display: "flex", gap: 24 }}>
            <Form.Item
              name="is_special_election"
              label="Special Election"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item name="is_open_seat" label="Open Seat" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item name="primary_date" label="Primary Date" style={{ flex: 1 }}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="general_date" label="General Election Date" style={{ flex: 1 }}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <Form.Item
            name="why_competitive"
            label={
              <span>
                Why Competitive{" "}
                <Tooltip title="Shown on the public Senate page under competitive races. Explain what makes this race interesting.">
                  <InfoCircleOutlined style={{ color: "#999" }} />
                </Tooltip>
              </span>
            }
          >
            <TextArea rows={3} placeholder="Explain what makes this race competitive..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={modalLoading} block>
              {editingRace ? "Save Changes" : "Create Race"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Preview + Candidate Management Drawer */}
      <Drawer
        title={
          previewRace
            ? `${(previewRace.district as any).state.name} — ${(previewRace.district as any).body.name}`
            : "Race Preview"
        }
        open={!!previewRace}
        onClose={() => setPreviewRace(null)}
        width={480}
      >
        {previewRace && (
          <>
            <RacePreview
              state={(previewRace.district as any).state.name}
              stateAbbr={(previewRace.district as any).state.abbr}
              rating={previewRace.rating}
              isSpecialElection={previewRace.is_special_election}
              isOpenSeat={previewRace.is_open_seat}
              whyCompetitive={previewRace.why_competitive}
              senateClass={(previewRace.district as any).senate_class}
              candidates={previewRace.race_candidates.map((rc) => ({
                name: `${rc.candidate.first_name} ${rc.candidate.last_name}`,
                party: rc.candidate.party,
                roleTitle: rc.candidate.role_title,
                isIncumbent: rc.is_incumbent,
              }))}
            />

            {/* Candidate management section */}
            <div style={{ marginTop: 24 }}>
              <Text strong>Candidates in this Race</Text>

              {previewRace.race_candidates.length === 0 ? (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">No candidates assigned yet.</Text>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {previewRace.race_candidates.map((rc) => (
                    <div
                      key={rc.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        background: "#fafafa",
                        borderRadius: 8,
                        border: "1px solid #f0f0f0",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: PARTY_DOTS[rc.candidate.party] ?? "#6b7280",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontWeight: 500, flex: 1 }}>
                        {rc.candidate.first_name} {rc.candidate.last_name}
                      </span>
                      <Select
                        value={rc.status}
                        onChange={(val) =>
                          handleCandidateStatusChange(rc.id, val)
                        }
                        size="small"
                        style={{ width: 120 }}
                        options={statusOptions}
                      />
                      <label
                        style={{
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={rc.is_incumbent}
                          onChange={(e) =>
                            handleCandidateIncumbentChange(rc.id, e.target.checked)
                          }
                        />
                        Inc.
                      </label>
                      <Popconfirm
                        title="Remove from race?"
                        onConfirm={() => handleRemoveCandidate(rc.id)}
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<CloseOutlined />}
                        />
                      </Popconfirm>
                    </div>
                  ))}
                </div>
              )}

              {/* Add candidate */}
              <div style={{ marginTop: 12 }}>
                <Select
                  placeholder="Add candidate to race..."
                  showSearch
                  style={{ width: "100%" }}
                  filterOption={(input, option) =>
                    (option?.label as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={allCandidates
                    .filter(
                      (c) =>
                        !previewRace.race_candidates.some(
                          (rc) => rc.candidate_id === c.id
                        )
                    )
                    .map((c) => ({
                      value: c.id,
                      label: `${c.first_name} ${c.last_name} (${c.party})`,
                    }))}
                  onSelect={(candidateId: number) => {
                    handleAddCandidate(previewRace.id, candidateId);
                  }}
                  value={null as any}
                />
              </div>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
