import { useState, useEffect, type ReactNode } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Typography,
  Space,
  Tag,
  Popconfirm,
  Drawer,
  Divider,
  message,
  Spin,
  Checkbox,
  Upload,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagsOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../../lib/supabase";

const { Text } = Typography;
const { TextArea } = Input;

// ─── Types ───

interface BillRow {
  id: number;
  bill_name: string;
  bill_number: string | null;
  vote_date: string | null;
  topic_id: number | null;
  summary: string | null;
  source_url: string | null;
  created_at: string;
  // Joined
  topic?: { name: string } | null;
  candidate_votes?: CandidateVoteRow[];
}

interface CandidateVoteRow {
  id: number;
  candidate_id: number;
  vote_id: number;
  vote: string;
  candidate?: { first_name: string; last_name: string; party: string; state?: { abbr: string } };
}

interface CandidateOption {
  id: number;
  label: string;
  party: string;
  stateAbbr: string;
}

interface TopicOption {
  id: number;
  name: string;
  slug: string;
}

/** Per-senator vote assignment in the modal */
interface SenatorVoteEntry {
  candidateId: number;
  vote: "yea" | "nay" | "abstain" | "not_voting" | null; // null = not assigned
}

interface Props {
  setHeaderActions: (actions: ReactNode) => void;
}

const voteOptions = [
  { value: "yea", label: "Yea" },
  { value: "nay", label: "Nay" },
  { value: "abstain", label: "Abstain" },
  { value: "not_voting", label: "Not Voting" },
];

const voteColors: Record<string, string> = {
  yea: "green",
  nay: "red",
  abstain: "default",
  not_voting: "default",
};

const partyColors: Record<string, string> = {
  Democrat: "blue",
  Republican: "red",
  Independent: "purple",
};

// ─── CSV Import ───

/** DB fields that CSV columns can map to */
const BILL_FIELDS = [
  { value: "", label: "Skip" },
  { value: "bill_name", label: "Bill Name" },
  { value: "bill_number", label: "Bill Number" },
  { value: "vote_date", label: "Vote Date" },
  { value: "topic", label: "Topic" },
  { value: "summary", label: "Summary" },
  { value: "source_url", label: "Source URL" },
] as const;

type BillFieldKey = "bill_name" | "bill_number" | "vote_date" | "topic" | "summary" | "source_url";

/** Auto-detect mapping from CSV header to bill field */
function autoDetectField(header: string): BillFieldKey | "" {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (h.includes("billname") || h === "bill" || h === "name") return "bill_name";
  if (h.includes("billnumber") || h.includes("billno") || h === "number") return "bill_number";
  if (h.includes("date") || h.includes("votedate")) return "vote_date";
  if (h.includes("topic") || h.includes("category") || h.includes("subject")) return "topic";
  if (h.includes("summary") || h.includes("description") || h.includes("desc")) return "summary";
  if (h.includes("source") || h.includes("url") || h.includes("link")) return "source_url";
  return "";
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

function parseCsvText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim() ?? "";
    });
    // Skip completely empty rows
    if (Object.values(row).some((v) => v !== "")) {
      rows.push(row);
    }
  }

  return { headers, rows };
}

// ─── Component ───

export default function VotesPage({ setHeaderActions }: Props) {
  const [bills, setBills] = useState<BillRow[]>([]);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingBill, setEditingBill] = useState<BillRow | null>(null);
  const [topicsDrawerOpen, setTopicsDrawerOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [topicLoading, setTopicLoading] = useState(false);

  // Senator vote assignments in modal
  const [senatorVotes, setSenatorVotes] = useState<SenatorVoteEntry[]>([]);
  const [senatorSearch, setSenatorSearch] = useState("");
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteVoteType, setPasteVoteType] = useState<"yea" | "nay">("yea");

  // CSV Import
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importCsvHeaders, setImportCsvHeaders] = useState<string[]>([]);
  const [importCsvRows, setImportCsvRows] = useState<Record<string, string>[]>([]);
  const [importFieldMapping, setImportFieldMapping] = useState<Record<string, BillFieldKey | "">>({});
  const [importLoading, setImportLoading] = useState(false);

  // Filters
  const [filterBill, setFilterBill] = useState("");
  const [filterTopic, setFilterTopic] = useState<string>("all");

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // ─── Header Actions ───

  useEffect(() => {
    setHeaderActions(
      <Space>
        <Button size="small" icon={<TagsOutlined />} onClick={() => setTopicsDrawerOpen(true)}>
          Topics
        </Button>
        <Button size="small" icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>
          Import CSV
        </Button>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Add Bill
        </Button>
      </Space>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  // ─── Data Loading ───

  async function loadBills() {
    const { data, error } = await supabase
      .from("votes")
      .select(`
        *,
        topic:topics(name),
        candidate_votes(
          id,
          candidate_id,
          vote_id,
          vote,
          candidate:candidates!inner(first_name, last_name, party, state:states(abbr))
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      messageApi.error(`Failed to load bills: ${error.message}`);
      return;
    }
    setBills((data ?? []) as unknown as BillRow[]);
  }

  async function loadCandidates() {
    const { data } = await supabase
      .from("candidates")
      .select("id, first_name, last_name, party, is_incumbent, role_title, state:states(abbr)")
      .eq("is_incumbent", true)
      .not("state_id", "is", null)
      .order("last_name");

    // Filter to senators only
    const senators = (data ?? []).filter((c: any) => {
      const role = (c.role_title ?? "") as string;
      return role.toLowerCase().includes("senator");
    });

    setCandidates(
      senators.map((c: any) => ({
        id: c.id,
        label: `${c.last_name}, ${c.first_name} (${c.party?.charAt(0)}-${c.state?.abbr ?? "?"})`,
        party: c.party,
        stateAbbr: c.state?.abbr ?? "",
      }))
    );
  }

  async function loadTopics() {
    const { data } = await supabase
      .from("topics")
      .select("id, name, slug")
      .order("name");

    setTopics((data ?? []) as TopicOption[]);
  }

  useEffect(() => {
    Promise.all([loadBills(), loadCandidates(), loadTopics()]).then(() =>
      setLoading(false)
    );
  }, []);

  // ─── CRUD ───

  function openCreateModal() {
    setEditingBill(null);
    form.resetFields();
    setSenatorSearch("");
    // Initialize all senators with null (unassigned)
    setSenatorVotes(candidates.map((c) => ({ candidateId: c.id, vote: null })));
    setModalOpen(true);
  }

  function openEditModal(bill: BillRow) {
    setEditingBill(bill);
    setSenatorSearch("");
    form.setFieldsValue({
      bill_name: bill.bill_name,
      bill_number: bill.bill_number,
      vote_date: bill.vote_date ? dayjs(bill.vote_date) : null,
      topic_id: bill.topic_id,
      summary: bill.summary,
      source_url: bill.source_url,
    });

    // Pre-populate senator votes from existing candidate_votes
    const existingVotes = new Map<number, string>();
    for (const cv of bill.candidate_votes ?? []) {
      existingVotes.set(cv.candidate_id, cv.vote);
    }

    setSenatorVotes(
      candidates.map((c) => ({
        candidateId: c.id,
        vote: (existingVotes.get(c.id) as SenatorVoteEntry["vote"]) ?? null,
      }))
    );
    setModalOpen(true);
  }

  async function handleSave() {
    try {
      const values = await form.validateFields();
      setModalLoading(true);

      const billPayload = {
        bill_name: values.bill_name,
        bill_number: values.bill_number || null,
        vote_date: values.vote_date ? values.vote_date.format("YYYY-MM-DD") : null,
        topic_id: values.topic_id || null,
        summary: values.summary || null,
        source_url: values.source_url || null,
      };

      let billId: number;

      if (editingBill) {
        const { error } = await supabase
          .from("votes")
          .update(billPayload)
          .eq("id", editingBill.id);
        if (error) throw error;
        billId = editingBill.id;

        // Delete existing candidate_votes for this bill, re-insert
        const { error: delErr } = await supabase
          .from("candidate_votes")
          .delete()
          .eq("vote_id", billId);
        if (delErr) throw delErr;
      } else {
        const { data, error } = await supabase
          .from("votes")
          .insert(billPayload)
          .select("id")
          .single();
        if (error) throw error;
        billId = data.id;
      }

      // Insert candidate_votes for assigned senators
      const assignedVotes = senatorVotes.filter((sv) => sv.vote !== null);
      if (assignedVotes.length > 0) {
        const rows = assignedVotes.map((sv) => ({
          candidate_id: sv.candidateId,
          vote_id: billId,
          vote: sv.vote!,
        }));
        const { error: cvErr } = await supabase.from("candidate_votes").insert(rows);
        if (cvErr) throw cvErr;
      }

      messageApi.success(editingBill ? "Bill updated" : "Bill created");
      setModalOpen(false);
      form.resetFields();
      setEditingBill(null);
      setSenatorVotes([]);
      await loadBills();
    } catch (err: any) {
      messageApi.error(err.message ?? "Failed to save");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleDelete(id: number) {
    // candidate_votes cascade on delete
    const { error } = await supabase.from("votes").delete().eq("id", id);
    if (error) {
      messageApi.error(`Delete failed: ${error.message}`);
    } else {
      messageApi.success("Bill deleted");
      await loadBills();
    }
  }

  // ─── Senator vote helpers ───

  function setSenatorVoteValue(candidateId: number, vote: SenatorVoteEntry["vote"]) {
    setSenatorVotes((prev) =>
      prev.map((sv) => (sv.candidateId === candidateId ? { ...sv, vote } : sv))
    );
  }

  function bulkSetVote(vote: SenatorVoteEntry["vote"]) {
    setSenatorVotes((prev) => prev.map((sv) => ({ ...sv, vote })));
  }

  // ─── Paste-and-Match senators ───

  /**
   * Parse a blob of senator names and match to candidates.
   * Handles formats like: "Collins (R-ME)", "Ossoff (D-GA)", "Smith", "John Smith"
   * Also handles comma-separated, newline-separated, or semicolon-separated.
   */
  function handlePasteMatch() {
    if (!pasteText.trim()) return;

    // Split on newlines, commas, or semicolons
    const entries = pasteText
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    let matchCount = 0;
    const updated = [...senatorVotes];

    for (const entry of entries) {
      // Extract name part (strip party/state in parens)
      const nameOnly = entry.replace(/\s*\([^)]*\)\s*/g, "").trim().toLowerCase();
      if (!nameOnly) continue;

      // Try to match against candidates
      const match = candidates.find((c) => {
        const last = c.label.split(",")[0].trim().toLowerCase();
        const full = c.label.toLowerCase();
        // Match by: last name, full label, or partial
        return (
          last === nameOnly ||
          full.includes(nameOnly) ||
          nameOnly.includes(last)
        );
      });

      if (match) {
        const idx = updated.findIndex((sv) => sv.candidateId === match.id);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], vote: pasteVoteType };
          matchCount++;
        }
      }
    }

    setSenatorVotes(updated);
    setPasteModalOpen(false);
    setPasteText("");
    messageApi.success(`Matched ${matchCount} of ${entries.length} entries as ${pasteVoteType.toUpperCase()}`);
  }

  // ─── CSV Import ───

  function handleCsvFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCsvText(text);
      if (rows.length === 0) {
        messageApi.error("No data rows found in CSV");
        return;
      }
      setImportCsvHeaders(headers);
      setImportCsvRows(rows);
      // Auto-detect field mappings
      const mapping: Record<string, BillFieldKey | ""> = {};
      headers.forEach((h) => {
        mapping[h] = autoDetectField(h);
      });
      setImportFieldMapping(mapping);
    };
    reader.readAsText(file);
    return false; // Prevent default upload
  }

  function resetImport() {
    setImportCsvHeaders([]);
    setImportCsvRows([]);
    setImportFieldMapping({});
    setImportModalOpen(false);
  }

  /** Build preview rows from CSV data + field mapping */
  function getImportPreview() {
    const billNameCol = Object.entries(importFieldMapping).find(([, v]) => v === "bill_name")?.[0];
    if (!billNameCol) return [];

    return importCsvRows.map((row, idx) => {
      const mapped: Record<string, string> = {};
      for (const [csvCol, field] of Object.entries(importFieldMapping)) {
        if (field) mapped[field] = row[csvCol] ?? "";
      }
      return { key: idx, ...mapped };
    });
  }

  async function handleImport() {
    const preview = getImportPreview();
    const valid = preview.filter((r) => (r as any).bill_name?.trim());

    if (valid.length === 0) {
      messageApi.error("No rows with a bill name to import");
      return;
    }

    setImportLoading(true);
    try {
      // Build topic name → ID lookup (case-insensitive)
      const topicMap = new Map(topics.map((t) => [t.name.toLowerCase(), t.id]));

      const payloads = valid.map((row: any) => ({
        bill_name: row.bill_name.trim(),
        bill_number: row.bill_number?.trim() || null,
        vote_date: row.vote_date?.trim() || null,
        topic_id: topicMap.get((row.topic ?? "").trim().toLowerCase()) ?? null,
        summary: row.summary?.trim() || null,
        source_url: row.source_url?.trim() || null,
      }));

      const { error } = await supabase.from("votes").insert(payloads);
      if (error) throw error;

      // Check for unmatched topics
      const unmatchedTopics = new Set<string>();
      for (const row of valid) {
        const t = (row as any).topic?.trim();
        if (t && !topicMap.has(t.toLowerCase())) {
          unmatchedTopics.add(t);
        }
      }

      let successMsg = `Imported ${payloads.length} bill${payloads.length !== 1 ? "s" : ""}`;
      if (unmatchedTopics.size > 0) {
        successMsg += `. ${unmatchedTopics.size} topic${unmatchedTopics.size !== 1 ? "s" : ""} not matched: ${[...unmatchedTopics].join(", ")}`;
      }
      messageApi.success(successMsg);

      resetImport();
      await loadBills();
    } catch (err: any) {
      messageApi.error(`Import failed: ${err.message}`);
    } finally {
      setImportLoading(false);
    }
  }

  // ─── Topics Drawer CRUD ───

  async function handleAddTopic() {
    const name = newTopicName.trim();
    if (!name) return;
    setTopicLoading(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { error } = await supabase.from("topics").insert({ name, slug });
    if (error) {
      messageApi.error(`Failed to add topic: ${error.message}`);
    } else {
      messageApi.success("Topic added");
      setNewTopicName("");
      await loadTopics();
    }
    setTopicLoading(false);
  }

  async function handleDeleteTopic(id: number) {
    const { error } = await supabase.from("topics").delete().eq("id", id);
    if (error) {
      messageApi.error(`Delete failed: ${error.message}`);
    } else {
      messageApi.success("Topic deleted");
      await loadTopics();
    }
  }

  // ─── Filtering ───

  const filteredBills = bills.filter((b) => {
    if (filterBill) {
      const text = `${b.bill_name} ${b.bill_number ?? ""}`.toLowerCase();
      if (!text.includes(filterBill.toLowerCase())) return false;
    }
    if (filterTopic !== "all") {
      if (String(b.topic_id) !== filterTopic) return false;
    }
    return true;
  });

  // ─── Table Columns ───

  const columns = [
    {
      title: "Bill",
      key: "bill",
      width: 240,
      render: (_: any, r: BillRow) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.bill_name}</div>
          {r.bill_number && <Text type="secondary" style={{ fontSize: 12 }}>{r.bill_number}</Text>}
        </div>
      ),
      sorter: (a: BillRow, b: BillRow) => a.bill_name.localeCompare(b.bill_name),
    },
    {
      title: "Date",
      dataIndex: "vote_date",
      key: "vote_date",
      width: 110,
      render: (d: string | null) => d ? dayjs(d).format("MMM D, YYYY") : "—",
      sorter: (a: BillRow, b: BillRow) => (a.vote_date ?? "").localeCompare(b.vote_date ?? ""),
    },
    {
      title: "Topic",
      key: "topic",
      width: 120,
      render: (_: any, r: BillRow) => r.topic?.name ?? <Text type="secondary">—</Text>,
    },
    {
      title: "Votes",
      key: "votes",
      width: 200,
      render: (_: any, r: BillRow) => {
        const cvs = r.candidate_votes ?? [];
        if (cvs.length === 0) return <Text type="secondary">No votes assigned</Text>;

        const yeaCount = cvs.filter((cv) => cv.vote === "yea").length;
        const nayCount = cvs.filter((cv) => cv.vote === "nay").length;
        const otherCount = cvs.length - yeaCount - nayCount;

        return (
          <Space size={4}>
            {yeaCount > 0 && <Tag color="green">{yeaCount} Yea</Tag>}
            {nayCount > 0 && <Tag color="red">{nayCount} Nay</Tag>}
            {otherCount > 0 && <Tag>{otherCount} Other</Tag>}
            <Text type="secondary" style={{ fontSize: 12 }}>({cvs.length} total)</Text>
          </Space>
        );
      },
    },
    {
      title: "Summary",
      dataIndex: "summary",
      key: "summary",
      ellipsis: true,
      render: (s: string | null) => s ?? <Text type="secondary">—</Text>,
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_: any, r: BillRow) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(r)} />
          <Popconfirm title="Delete this bill and all its votes?" onConfirm={() => handleDelete(r.id)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  // Filter senators for the modal checklist — search + flat alphabetical
  const filteredSenators = candidates.filter((c) => {
    if (!senatorSearch) return true;
    const q = senatorSearch.toLowerCase();
    return c.label.toLowerCase().includes(q) || c.stateAbbr.toLowerCase().includes(q);
  });

  const assignedCount = senatorVotes.filter((sv) => sv.vote !== null).length;

  return (
    <div>
      {contextHolder}

      {/* Filters */}
      <div style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Input.Search
          placeholder="Search by bill name..."
          allowClear
          style={{ width: 260 }}
          onSearch={(v) => setFilterBill(v)}
          onChange={(e) => {
            if (!e.target.value) setFilterBill("");
          }}
        />
        <Select
          value={filterTopic}
          onChange={setFilterTopic}
          style={{ width: 160 }}
          options={[
            { value: "all", label: "All Topics" },
            ...topics.map((t) => ({ value: String(t.id), label: t.name })),
          ]}
        />
        <Text type="secondary" style={{ lineHeight: "32px" }}>
          {filteredBills.length} bill{filteredBills.length !== 1 ? "s" : ""}
        </Text>
      </div>

      {/* Table */}
      <Table
        dataSource={filteredBills}
        columns={columns as any}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t} bills` }}
        expandable={{
          expandedRowRender: (record: BillRow) => {
            const cvs = record.candidate_votes ?? [];
            if (cvs.length === 0) return <Text type="secondary">No senator votes assigned yet.</Text>;
            return (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {cvs
                  .sort((a, b) => (a.candidate?.last_name ?? "").localeCompare(b.candidate?.last_name ?? ""))
                  .map((cv) => {
                    const c = cv.candidate;
                    if (!c) return null;
                    return (
                      <Tag key={cv.id} color={voteColors[cv.vote] ?? "default"}>
                        {c.first_name} {c.last_name} ({c.party?.charAt(0)}-{c.state?.abbr}): {cv.vote.toUpperCase()}
                      </Tag>
                    );
                  })}
              </div>
            );
          },
          rowExpandable: (record: BillRow) => (record.candidate_votes ?? []).length > 0,
        }}
      />

      {/* Create/Edit Bill Modal */}
      <Modal
        title={editingBill ? "Edit Bill" : "Add Bill"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingBill(null);
          setSenatorVotes([]);
        }}
        onOk={handleSave}
        confirmLoading={modalLoading}
        okText={editingBill ? "Update" : "Create"}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="bill_name"
            label="Bill Name"
            rules={[{ required: true, message: "Enter bill name" }]}
          >
            <Input placeholder="e.g. SAVE Act" />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="bill_number" label="Bill Number">
              <Input placeholder="e.g. H.R.1234" />
            </Form.Item>

            <Form.Item name="vote_date" label="Vote Date">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="topic_id" label="Topic">
              <Select
                allowClear
                placeholder="Select topic"
                options={topics.map((t) => ({ value: t.id, label: t.name }))}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "8px 0" }} />
                    <div style={{ padding: "0 8px 4px", display: "flex", gap: 8 }}>
                      <Input
                        size="small"
                        placeholder="New topic..."
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        onPressEnter={handleAddTopic}
                      />
                      <Button size="small" type="text" icon={<PlusOutlined />} onClick={handleAddTopic} loading={topicLoading}>
                        Add
                      </Button>
                    </div>
                  </>
                )}
              />
            </Form.Item>

            <Form.Item name="source_url" label="Source URL">
              <Input placeholder="Link to official record" />
            </Form.Item>
          </div>

          <Form.Item name="summary" label="Summary">
            <TextArea rows={2} placeholder="Factual, 1-2 sentences about the bill" />
          </Form.Item>
        </Form>

        {/* Senator Vote Assignments */}
        <Divider style={{ margin: "12px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text strong>Senator Votes ({assignedCount} assigned)</Text>
          <Space size="small">
            <Button size="small" onClick={() => setPasteModalOpen(true)}>Paste Names</Button>
            <Button size="small" onClick={() => bulkSetVote("yea")}>All Yea</Button>
            <Button size="small" onClick={() => bulkSetVote("nay")}>All Nay</Button>
            <Button size="small" onClick={() => bulkSetVote(null)}>Clear</Button>
          </Space>
        </div>

        {/* Search senators */}
        <Input
          size="small"
          placeholder="Search senators by name or state..."
          allowClear
          value={senatorSearch}
          onChange={(e) => setSenatorSearch(e.target.value)}
          style={{ marginBottom: 8 }}
        />

        <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #f0f0f0", borderRadius: 6, padding: 8 }}>
          {filteredSenators.length === 0 ? (
            <Text type="secondary" style={{ padding: 8, display: "block" }}>No senators match "{senatorSearch}"</Text>
          ) : (
            filteredSenators.map((senator) => {
              const entry = senatorVotes.find((sv) => sv.candidateId === senator.id);
              const currentVote = entry?.vote ?? null;
              return (
                <div key={senator.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 4px", borderBottom: "1px solid #fafafa" }}>
                  <Checkbox
                    checked={currentVote !== null}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSenatorVoteValue(senator.id, "yea");
                      } else {
                        setSenatorVoteValue(senator.id, null);
                      }
                    }}
                  />
                  <Tag color={partyColors[senator.party] ?? "default"} style={{ margin: 0, minWidth: 20, textAlign: "center" }}>
                    {senator.party.charAt(0)}
                  </Tag>
                  <span style={{ flex: 1, fontSize: 13 }}>{senator.label}</span>
                  {currentVote !== null && (
                    <Select
                      size="small"
                      value={currentVote}
                      onChange={(v) => setSenatorVoteValue(senator.id, v)}
                      style={{ width: 110 }}
                      options={voteOptions}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* Paste Names Modal */}
      <Modal
        title="Paste Senator Names"
        open={pasteModalOpen}
        onCancel={() => { setPasteModalOpen(false); setPasteText(""); }}
        onOk={handlePasteMatch}
        okText={`Assign as ${pasteVoteType.toUpperCase()}`}
        width={500}
        destroyOnClose
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Paste senator names from your spreadsheet (comma, semicolon, or newline separated).
            Formats like "Collins (R-ME)" or just "Collins" work.
          </Text>
        </div>
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ fontSize: 13 }}>Assign as:</Text>
          <Select
            size="small"
            value={pasteVoteType}
            onChange={setPasteVoteType}
            style={{ width: 110, marginLeft: 8 }}
            options={[
              { value: "yea", label: "Yea" },
              { value: "nay", label: "Nay" },
            ]}
          />
        </div>
        <TextArea
          rows={8}
          placeholder={"Collins (R-ME), Ossoff (D-GA), Warnock (D-GA)\n\nor paste one per line:\nCollins\nOssoff\nWarnock"}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          autoFocus
        />
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        title="Import Bills from CSV"
        open={importModalOpen}
        onCancel={resetImport}
        footer={
          importCsvRows.length > 0
            ? [
                <Button key="cancel" onClick={resetImport}>Cancel</Button>,
                <Button key="back" onClick={() => { setImportCsvHeaders([]); setImportCsvRows([]); setImportFieldMapping({}); }}>
                  Re-upload
                </Button>,
                <Button
                  key="import"
                  type="primary"
                  loading={importLoading}
                  disabled={!Object.values(importFieldMapping).includes("bill_name")}
                  onClick={handleImport}
                >
                  Import {getImportPreview().filter((r) => (r as any).bill_name?.trim()).length} Bills
                </Button>,
              ]
            : null
        }
        width={800}
        destroyOnClose
      >
        {importCsvRows.length === 0 ? (
          /* Step 1: Upload */
          <div>
            <Upload.Dragger
              accept=".csv,.tsv,.txt"
              showUploadList={false}
              beforeUpload={handleCsvFile}
              style={{ marginBottom: 16 }}
            >
              <p style={{ fontSize: 32, color: "#999", margin: "8px 0" }}>
                <UploadOutlined />
              </p>
              <p style={{ fontSize: 14, color: "#666" }}>
                Click or drag a CSV file here
              </p>
              <p style={{ fontSize: 12, color: "#999" }}>
                One row per bill. Headers will be auto-mapped to fields.
              </p>
            </Upload.Dragger>
            <Alert
              type="info"
              showIcon
              message="Expected columns"
              description="bill_name (required), bill_number, vote_date, topic, summary, source_url. Column names are flexible — you'll map them in the next step."
              style={{ marginTop: 8 }}
            />
          </div>
        ) : (
          /* Step 2: Field mapping + Preview */
          <div>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              Map CSV columns to bill fields ({importCsvRows.length} rows found)
            </Text>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {importCsvHeaders.map((header) => (
                <div key={header} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Text style={{ minWidth: 120, fontSize: 13 }} ellipsis>
                    {header}
                  </Text>
                  <Select
                    size="small"
                    value={importFieldMapping[header] ?? ""}
                    onChange={(v) => setImportFieldMapping((prev) => ({ ...prev, [header]: v }))}
                    style={{ flex: 1 }}
                    options={BILL_FIELDS.map((f) => ({ ...f }))}
                  />
                </div>
              ))}
            </div>

            {!Object.values(importFieldMapping).includes("bill_name") && (
              <Alert
                type="warning"
                showIcon
                message="Map at least one column to 'Bill Name' to continue"
                style={{ marginBottom: 12 }}
              />
            )}

            {/* Preview table */}
            {Object.values(importFieldMapping).includes("bill_name") && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  Preview ({getImportPreview().filter((r) => (r as any).bill_name?.trim()).length} valid rows)
                </Text>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  <Table
                    dataSource={getImportPreview().slice(0, 50)}
                    columns={[
                      { title: "Bill Name", dataIndex: "bill_name", key: "bill_name", ellipsis: true },
                      { title: "Number", dataIndex: "bill_number", key: "bill_number", width: 100 },
                      { title: "Date", dataIndex: "vote_date", key: "vote_date", width: 100 },
                      {
                        title: "Topic",
                        dataIndex: "topic",
                        key: "topic",
                        width: 120,
                        render: (t: string) => {
                          if (!t) return <Text type="secondary">—</Text>;
                          const matched = topics.some((tp) => tp.name.toLowerCase() === t.toLowerCase());
                          return matched ? <Tag color="green">{t}</Tag> : <Tag color="orange">{t} (new)</Tag>;
                        },
                      },
                      { title: "Summary", dataIndex: "summary", key: "summary", ellipsis: true },
                    ]}
                    rowKey="key"
                    size="small"
                    pagination={false}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Topics Drawer */}
      <Drawer
        title="Manage Topics"
        open={topicsDrawerOpen}
        onClose={() => setTopicsDrawerOpen(false)}
        width={360}
      >
        <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
          <Input
            placeholder="New topic name..."
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            onPressEnter={handleAddTopic}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTopic} loading={topicLoading}>
            Add
          </Button>
        </div>
        <Divider style={{ margin: "12px 0" }} />
        {topics.length === 0 ? (
          <Text type="secondary">No topics yet. Add one above.</Text>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topics.map((t) => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{t.name}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.slug}</Text>
                </div>
                <Popconfirm title="Delete this topic?" onConfirm={() => handleDeleteTopic(t.id)}>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
}
