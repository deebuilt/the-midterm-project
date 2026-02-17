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
  Card,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagsOutlined,
  UploadOutlined,
  CloudDownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../../lib/supabase";
import { useIsMobile } from "./useIsMobile";

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
  result: string | null;
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
  { value: "result", label: "Result" },
] as const;

type BillFieldKey = "bill_name" | "bill_number" | "vote_date" | "topic" | "summary" | "source_url" | "result";

/** Auto-detect mapping from CSV header to bill field */
function autoDetectField(header: string): BillFieldKey | "" {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (h.includes("billname") || h === "bill" || h === "name") return "bill_name";
  if (h.includes("billnumber") || h.includes("billno") || h === "number") return "bill_number";
  if (h.includes("date") || h.includes("votedate")) return "vote_date";
  if (h.includes("topic") || h.includes("category") || h.includes("subject")) return "topic";
  if (h.includes("summary") || h.includes("description") || h.includes("desc")) return "summary";
  if (h.includes("source") || h.includes("url") || h.includes("link")) return "source_url";
  if (h.includes("result") || h.includes("outcome") || h.includes("passed")) return "result";
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

// ─── Senate.gov XML Types ───

interface SenateVoteListItem {
  key: string;
  voteNumber: string;
  voteDate: string;
  issue: string;
  question: string;
  result: string;
  title: string;
  yeas: number;
  nays: number;
}

interface SenateVoteDetail {
  voteNumber: string;
  question: string;
  result: string;
  voteDate: string;
  billNumber: string;
  title: string;
  members: SenateVoteMember[];
}

interface SenateVoteMember {
  firstName: string;
  lastName: string;
  party: string;
  state: string;
  voteCast: string;
}

/** Procedural vote patterns to filter out by default */
const PROCEDURAL_PATTERNS = [
  /cloture/i,
  /motion to proceed/i,
  /motion to reconsider/i,
  /motion to table/i,
  /motion to waive/i,
];

const NOMINATION_PATTERNS = [
  /^on the nomination$/i,
  /^confirmation$/i,
];

function isProceduralVote(question: string): boolean {
  return PROCEDURAL_PATTERNS.some((p) => p.test(question));
}

function isNominationVote(question: string, result: string, issue: string): boolean {
  if (NOMINATION_PATTERNS.some((p) => p.test(question))) return true;
  if (result === "Confirmed") return true;
  if (/^PN\d/.test(issue)) return true;
  return false;
}

function isTreatyVote(question: string): boolean {
  return /treaty/i.test(question);
}

/** Parse the vote list XML from Senate.gov */
function parseVoteListXml(xmlText: string): SenateVoteListItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) throw new Error("Invalid XML");

  const votes: SenateVoteListItem[] = [];
  const voteEls = doc.querySelectorAll("vote");

  for (const el of voteEls) {
    // Skip en_bloc votes (nominations bundled together)
    if (el.querySelector("en_bloc")) continue;

    const voteNumber = el.querySelector("vote_number")?.textContent?.trim() ?? "";
    const voteDate = el.querySelector("vote_date")?.textContent?.trim() ?? "";
    const issue = el.querySelector("issue")?.textContent?.trim() ?? "";
    const question = el.querySelector("question")?.textContent?.trim() ?? "";
    const result = el.querySelector("result")?.textContent?.trim() ?? "";
    const title = el.querySelector("title")?.textContent?.trim() ?? "";
    const yeas = parseInt(el.querySelector("vote_tally > yeas")?.textContent ?? "0", 10);
    const nays = parseInt(el.querySelector("vote_tally > nays")?.textContent ?? "0", 10);

    votes.push({
      key: voteNumber,
      voteNumber,
      voteDate,
      issue,
      question,
      result,
      title,
      yeas,
      nays,
    });
  }

  return votes;
}

/** Parse an individual roll call vote XML from Senate.gov */
function parseVoteDetailXml(xmlText: string): SenateVoteDetail {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) throw new Error("Invalid XML");

  const voteNumber = doc.querySelector("vote_number")?.textContent?.trim() ?? "";
  const question = doc.querySelector("vote_question_text")?.textContent?.trim()
    ?? doc.querySelector("question")?.textContent?.trim() ?? "";
  const result = doc.querySelector("vote_result_text")?.textContent?.trim()
    ?? doc.querySelector("result")?.textContent?.trim() ?? "";
  const voteDate = doc.querySelector("vote_date")?.textContent?.trim() ?? "";

  // Build bill number from document section
  const docType = doc.querySelector("document > document_type")?.textContent?.trim() ?? "";
  const docNumber = doc.querySelector("document > document_number")?.textContent?.trim() ?? "";
  const billNumber = docType && docNumber ? `${docType} ${docNumber}` : "";

  const title = doc.querySelector("vote_title")?.textContent?.trim()
    ?? doc.querySelector("vote_document_text")?.textContent?.trim() ?? "";

  const members: SenateVoteMember[] = [];
  const memberEls = doc.querySelectorAll("member");
  for (const m of memberEls) {
    members.push({
      firstName: m.querySelector("first_name")?.textContent?.trim() ?? "",
      lastName: m.querySelector("last_name")?.textContent?.trim() ?? "",
      party: m.querySelector("party")?.textContent?.trim() ?? "",
      state: m.querySelector("state")?.textContent?.trim() ?? "",
      voteCast: m.querySelector("vote_cast")?.textContent?.trim() ?? "",
    });
  }

  return { voteNumber, question, result, voteDate, billNumber, title, members };
}

/** Map Senate.gov vote_cast to our vote_enum */
function mapVoteCast(voteCast: string): "yea" | "nay" | "abstain" | "not_voting" {
  const v = voteCast.toLowerCase();
  if (v === "yea") return "yea";
  if (v === "nay") return "nay";
  if (v === "not voting") return "not_voting";
  if (v === "present") return "abstain";
  return "not_voting";
}

/** Build the URL for an individual roll call vote */
function buildVoteDetailUrl(congress: number, session: number, voteNumber: string): string {
  const padded = voteNumber.padStart(5, "0");
  return `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${congress}${session}/vote_${congress}_${session}_${padded}.xml`;
}

/** Build the HTML URL for a vote (used as source_url) */
function buildVoteHtmlUrl(congress: number, session: number, voteNumber: string): string {
  const padded = voteNumber.padStart(5, "0");
  return `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${congress}${session}/vote_${congress}_${session}_${padded}.htm`;
}

/** Fetch a Senate.gov XML URL via our Edge Function proxy (bypasses CORS) */
async function fetchSenateXml(url: string, authToken: string): Promise<string> {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const resp = await fetch(`${supabaseUrl}/functions/v1/senate-proxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
      apikey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ url }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
    throw new Error(body.error ?? `Proxy returned ${resp.status}`);
  }

  return resp.text();
}

/** Parse a Senate.gov date like "18-Dec" into YYYY-MM-DD using the congress year */
function parseSenateDate(dateStr: string, congressYear: number): string | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{1,2})-(\w{3})$/);
  if (!match) return null;
  const day = match[1].padStart(2, "0");
  const monthMap: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const month = monthMap[match[2]];
  if (!month) return null;
  return `${congressYear}-${month}-${day}`;
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

  // Senate.gov Import
  const [senateDrawerOpen, setSenateDrawerOpen] = useState(false);
  const [senateCongress, setSenateCongress] = useState(119);
  const [senateSession, setSenateSession] = useState(1);
  const [senateCongressYear, setSenateCongressYear] = useState(2025);
  const [senateVoteList, setSenateVoteList] = useState<SenateVoteListItem[]>([]);
  const [senateSelected, setSenateSelected] = useState<Set<string>>(new Set());
  const [senateListLoading, setSenateListLoading] = useState(false);
  const [senateListPasteMode, setSenateListPasteMode] = useState(false);
  const [senateListPasteText, setSenateListPasteText] = useState("");
  const [senateHideProcedural, setSenateHideProcedural] = useState(true);
  const [senateHideNominations, setSenateHideNominations] = useState(true);
  const [senateHideTreaties, setSenateHideTreaties] = useState(true);
  const [senateSearch, setSenateSearch] = useState("");
  const [senateImportStep, setSenateImportStep] = useState<"list" | "loading" | "done">("list");
  const [senateImportProgress, setSenateImportProgress] = useState({ current: 0, total: 0, imported: 0, skipped: 0, failed: 0 });
  const [senateDetailPasteMode, setSenateDetailPasteMode] = useState(false);
  const [senateDetailPasteQueue, setSenateDetailPasteQueue] = useState<string[]>([]);
  const [senateDetailPasteText, setSenateDetailPasteText] = useState("");
  const [senateDetailPasteIdx, setSenateDetailPasteIdx] = useState(0);
  const [senateImportResults, setSenateImportResults] = useState<{ voteNumber: string; billName: string; status: "imported" | "skipped" | "failed"; reason?: string }[]>([]);

  // Filters
  const [filterBill, setFilterBill] = useState("");
  const [filterTopic, setFilterTopic] = useState<string>("all");

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const isMobile = useIsMobile();

  // ─── Header Actions ───

  useEffect(() => {
    setHeaderActions(
      <Space size={isMobile ? 4 : 8}>
        <Button size="small" icon={<TagsOutlined />} onClick={() => setTopicsDrawerOpen(true)}>
          Topics
        </Button>
        {!isMobile && (
          <Button size="small" icon={<CloudDownloadOutlined />} onClick={() => setSenateDrawerOpen(true)}>
            Senate.gov
          </Button>
        )}
        {!isMobile && (
          <Button size="small" icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>
            Import CSV
          </Button>
        )}
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Add Bill
        </Button>
      </Space>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions, isMobile]);

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
    // Look up senate body_id for filtering
    const { data: senateBody } = await supabase
      .from("government_bodies")
      .select("id")
      .eq("slug", "us-senate")
      .single();

    const { data } = await supabase
      .from("candidates")
      .select("id, first_name, last_name, party, is_incumbent, state:states(abbr)")
      .eq("is_incumbent", true)
      .eq("body_id", senateBody?.id ?? 0)
      .not("state_id", "is", null)
      .order("last_name");

    setCandidates(
      (data ?? []).map((c: any) => ({
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
      result: bill.result,
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
        result: values.result || null,
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
        result: row.result?.trim() || null,
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

  // ─── Senate.gov Import ───

  function resetSenateImport() {
    setSenateVoteList([]);
    setSenateSelected(new Set());
    setSenateListPasteMode(false);
    setSenateListPasteText("");
    setSenateImportStep("list");
    setSenateImportProgress({ current: 0, total: 0, imported: 0, skipped: 0, failed: 0 });
    setSenateImportResults([]);
    setSenateDetailPasteMode(false);
    setSenateDetailPasteQueue([]);
    setSenateDetailPasteText("");
    setSenateDetailPasteIdx(0);
    setSenateSearch("");
  }

  async function fetchSenateVoteList() {
    setSenateListLoading(true);
    const url = `https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_${senateCongress}_${senateSession}.xml`;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const text = await fetchSenateXml(url, session.access_token);
      const votes = parseVoteListXml(text);
      setSenateVoteList(votes);
      setSenateListPasteMode(false);
      messageApi.success(`Loaded ${votes.length} votes`);
    } catch (err: any) {
      // Edge Function unavailable — fall back to paste mode
      setSenateListPasteMode(true);
      messageApi.info(err.message || "Fetch failed — paste the XML instead");
    } finally {
      setSenateListLoading(false);
    }
  }

  function handleSenateListPaste() {
    try {
      const votes = parseVoteListXml(senateListPasteText);
      setSenateVoteList(votes);
      setSenateListPasteText("");
      messageApi.success(`Loaded ${votes.length} votes`);
    } catch (err: any) {
      messageApi.error(`Failed to parse XML: ${err.message}`);
    }
  }

  /** Get the filtered+visible senate vote list */
  function getFilteredSenateVotes(): SenateVoteListItem[] {
    return senateVoteList.filter((v) => {
      if (senateHideProcedural && isProceduralVote(v.question)) return false;
      if (senateHideNominations && isNominationVote(v.question, v.result, v.issue)) return false;
      if (senateHideTreaties && isTreatyVote(v.question)) return false;
      if (senateSearch) {
        const q = senateSearch.toLowerCase();
        const searchable = `${v.title} ${v.issue} ${v.question}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }

  async function importSenateVotes() {
    const selected = Array.from(senateSelected);
    if (selected.length === 0) {
      messageApi.warning("No votes selected");
      return;
    }

    // Get auth token upfront
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      messageApi.error("Not authenticated");
      return;
    }

    setSenateImportStep("loading");
    const progress = { current: 0, total: selected.length, imported: 0, skipped: 0, failed: 0 };
    setSenateImportProgress(progress);
    const results: typeof senateImportResults = [];

    // Try proxy for the first vote to verify it works
    let usePasteMode = false;
    const firstUrl = buildVoteDetailUrl(senateCongress, senateSession, selected[0]);
    try {
      await fetchSenateXml(firstUrl, session.access_token);
    } catch {
      usePasteMode = true;
    }

    if (usePasteMode) {
      // Edge Function unavailable — fall back to paste queue
      setSenateDetailPasteMode(true);
      setSenateDetailPasteQueue(selected);
      setSenateDetailPasteIdx(0);
      return;
    }

    // Proxy works — fetch all selected votes through it
    for (const voteNum of selected) {
      progress.current++;
      setSenateImportProgress({ ...progress });

      try {
        const url = buildVoteDetailUrl(senateCongress, senateSession, voteNum);
        const xml = await fetchSenateXml(url, session.access_token);
        const result = await importSingleVote(xml, voteNum);
        results.push(result);
        if (result.status === "imported") progress.imported++;
        else if (result.status === "skipped") progress.skipped++;
        else progress.failed++;
      } catch (err: any) {
        const listItem = senateVoteList.find((v) => v.voteNumber === voteNum);
        results.push({ voteNumber: voteNum, billName: listItem?.title ?? voteNum, status: "failed", reason: err.message });
        progress.failed++;
      }

      setSenateImportProgress({ ...progress });
    }

    setSenateImportResults(results);
    setSenateImportStep("done");
    await loadBills();
  }

  async function handleSenateDetailPaste() {
    if (!senateDetailPasteText.trim()) return;
    const voteNum = senateDetailPasteQueue[senateDetailPasteIdx];

    try {
      const result = await importSingleVote(senateDetailPasteText, voteNum);
      setSenateImportResults((prev) => [...prev, result]);
      setSenateImportProgress((prev) => ({
        ...prev,
        current: prev.current + 1,
        imported: prev.imported + (result.status === "imported" ? 1 : 0),
        skipped: prev.skipped + (result.status === "skipped" ? 1 : 0),
        failed: prev.failed + (result.status === "failed" ? 1 : 0),
      }));
    } catch (err: any) {
      const listItem = senateVoteList.find((v) => v.voteNumber === voteNum);
      setSenateImportResults((prev) => [...prev, { voteNumber: voteNum, billName: listItem?.title ?? voteNum, status: "failed", reason: err.message }]);
      setSenateImportProgress((prev) => ({ ...prev, current: prev.current + 1, failed: prev.failed + 1 }));
    }

    setSenateDetailPasteText("");
    if (senateDetailPasteIdx + 1 >= senateDetailPasteQueue.length) {
      // All done
      setSenateDetailPasteMode(false);
      setSenateImportStep("done");
      await loadBills();
    } else {
      setSenateDetailPasteIdx(senateDetailPasteIdx + 1);
    }
  }

  /** Import a single vote from its detail XML. Returns result info. */
  async function importSingleVote(xmlText: string, voteNumber: string) {
    const detail = parseVoteDetailXml(xmlText);

    // Use the issue/bill number from the list if detail doesn't have it
    const listItem = senateVoteList.find((v) => v.voteNumber === voteNumber);
    const billNumber = detail.billNumber || listItem?.issue || "";
    const billName = detail.title || listItem?.title || `Vote #${voteNumber}`;

    // Clean up result text — take first part before parenthetical tallies
    let resultText = detail.result || listItem?.result || "";
    const parenIdx = resultText.indexOf("(");
    if (parenIdx > 0) resultText = resultText.substring(0, parenIdx).trim();

    // Check for duplicate by bill_number
    if (billNumber) {
      const existing = bills.find((b) => b.bill_number === billNumber);
      if (existing) {
        return { voteNumber, billName, status: "skipped" as const, reason: `Already exists: ${existing.bill_name}` };
      }
    }

    const voteDate = parseSenateDate(listItem?.voteDate ?? "", senateCongressYear)
      ?? (detail.voteDate ? detail.voteDate.split("T")[0] : null);
    const sourceUrl = buildVoteHtmlUrl(senateCongress, senateSession, voteNumber);

    // Insert bill
    const { data: billData, error: billErr } = await supabase
      .from("votes")
      .insert({
        bill_name: billName,
        bill_number: billNumber || null,
        vote_date: voteDate,
        result: resultText || null,
        source_url: sourceUrl,
        summary: null,
        topic_id: null,
      })
      .select("id")
      .single();

    if (billErr) throw billErr;
    const billId = billData.id;

    // Match senators and insert candidate_votes
    let matchedCount = 0;
    const candidateVoteRows: { candidate_id: number; vote_id: number; vote: string }[] = [];

    for (const member of detail.members) {
      // Match by last_name + state
      const match = candidates.find(
        (c) => c.label.split(",")[0].trim().toLowerCase() === member.lastName.toLowerCase()
          && c.stateAbbr === member.state
      );
      if (match) {
        candidateVoteRows.push({
          candidate_id: match.id,
          vote_id: billId,
          vote: mapVoteCast(member.voteCast),
        });
        matchedCount++;
      }
    }

    if (candidateVoteRows.length > 0) {
      const { error: cvErr } = await supabase.from("candidate_votes").insert(candidateVoteRows);
      if (cvErr) throw cvErr;
    }

    return {
      voteNumber,
      billName,
      status: "imported" as const,
      reason: `${matchedCount} senator votes matched`,
    };
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
      title: "Result",
      dataIndex: "result",
      key: "result",
      width: 100,
      render: (r: string | null) => r ? <Tag>{r}</Tag> : <Text type="secondary">—</Text>,
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

  const mobileCards = isMobile && (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {filteredBills.map((r) => {
        const cvs = r.candidate_votes ?? [];
        const yeaCount = cvs.filter((cv) => cv.vote === "yea").length;
        const nayCount = cvs.filter((cv) => cv.vote === "nay").length;
        return (
          <Card key={r.id} size="small" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong style={{ fontSize: 14 }}>{r.bill_name}</Text>
                {r.bill_number && <Text type="secondary" style={{ fontSize: 12, display: "block" }}>{r.bill_number}</Text>}
              </div>
              <Space size="small">
                <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(r)} />
                <Popconfirm title="Delete this bill and all its votes?" onConfirm={() => handleDelete(r.id)}>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              {r.vote_date && <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(r.vote_date).format("MMM D, YYYY")}</Text>}
              {r.topic?.name && <Tag style={{ margin: 0 }}>{r.topic.name}</Tag>}
              {r.result && <Tag style={{ margin: 0 }}>{r.result}</Tag>}
            </div>
            {cvs.length > 0 && (
              <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {yeaCount > 0 && <Tag color="green" style={{ margin: 0 }}>{yeaCount} Yea</Tag>}
                {nayCount > 0 && <Tag color="red" style={{ margin: 0 }}>{nayCount} Nay</Tag>}
                <Text type="secondary" style={{ fontSize: 12 }}>({cvs.length} total)</Text>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );

  return (
    <div>
      {contextHolder}

      {/* Filters */}
      <div style={{ marginBottom: 16, display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, flexWrap: "wrap" }}>
        <Input.Search
          placeholder="Search by bill name..."
          allowClear
          style={{ width: isMobile ? "100%" : 260 }}
          onSearch={(v) => setFilterBill(v)}
          onChange={(e) => {
            if (!e.target.value) setFilterBill("");
          }}
        />
        <Select
          value={filterTopic}
          onChange={setFilterTopic}
          style={{ width: isMobile ? "100%" : 160 }}
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
      {isMobile ? mobileCards : (
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
      )}

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
        width={isMobile ? "100vw" : 700}
        style={isMobile ? { top: 0, maxWidth: "100vw", margin: 0, paddingBottom: 0 } : undefined}
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

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <Form.Item name="bill_number" label="Bill Number">
              <Input placeholder="e.g. H.R.1234" />
            </Form.Item>

            <Form.Item name="vote_date" label="Vote Date">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
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

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <Form.Item name="result" label="Result">
              <Select
                allowClear
                placeholder="Select result"
                options={[
                  { value: "Passed", label: "Passed" },
                  { value: "Rejected", label: "Rejected" },
                  { value: "Agreed to", label: "Agreed to" },
                  { value: "Not Sustained", label: "Not Sustained" },
                  { value: "Well Taken", label: "Well Taken" },
                  { value: "Confirmed", label: "Confirmed" },
                ]}
              />
            </Form.Item>
            <div />
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
        width={isMobile ? "100vw" : 500}
        style={isMobile ? { top: 0, maxWidth: "100vw", margin: 0, paddingBottom: 0 } : undefined}
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
        width={isMobile ? "100vw" : 800}
        style={isMobile ? { top: 0, maxWidth: "100vw", margin: 0, paddingBottom: 0 } : undefined}
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
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 16 }}>
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

      {/* Senate.gov Import Drawer */}
      <Drawer
        title="Import from Senate.gov"
        open={senateDrawerOpen}
        onClose={() => { setSenateDrawerOpen(false); resetSenateImport(); }}
        width={isMobile ? "100%" : 780}
        destroyOnClose
      >
        {senateImportStep === "list" && (
          <>
            {/* Step 1: Fetch or Paste vote list */}
            {senateVoteList.length === 0 ? (
              <div>
                <Text strong style={{ display: "block", marginBottom: 12 }}>
                  Step 1: Load Vote List
                </Text>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <Select
                    size="small"
                    value={senateCongress}
                    onChange={(v) => {
                      setSenateCongress(v);
                      setSenateCongressYear(v === 119 ? 2025 : v === 118 ? 2023 : 2025);
                    }}
                    style={{ width: 140 }}
                    options={[
                      { value: 119, label: "119th Congress" },
                      { value: 118, label: "118th Congress" },
                    ]}
                  />
                  <Select
                    size="small"
                    value={senateSession}
                    onChange={setSenateSession}
                    style={{ width: 110 }}
                    options={[
                      { value: 1, label: "Session 1" },
                      { value: 2, label: "Session 2" },
                    ]}
                  />
                  <Button
                    size="small"
                    type="primary"
                    icon={<CloudDownloadOutlined />}
                    loading={senateListLoading}
                    onClick={fetchSenateVoteList}
                  >
                    Fetch Votes
                  </Button>
                </div>

                {senateListPasteMode && (
                  <div>
                    <Alert
                      type="info"
                      showIcon
                      message="Direct fetch blocked (CORS)"
                      description={
                        <>
                          Open{" "}
                          <a
                            href={`https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_${senateCongress}_${senateSession}.xml`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            this URL
                          </a>
                          {" "}in your browser, select all (Ctrl+A), copy (Ctrl+C), and paste below.
                        </>
                      }
                      style={{ marginBottom: 12 }}
                    />
                    <TextArea
                      rows={8}
                      placeholder="Paste the XML here..."
                      value={senateListPasteText}
                      onChange={(e) => setSenateListPasteText(e.target.value)}
                    />
                    <Button
                      type="primary"
                      style={{ marginTop: 8 }}
                      disabled={!senateListPasteText.trim()}
                      onClick={handleSenateListPaste}
                    >
                      Parse XML
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* Step 2: Filter & Select */
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Text strong>
                    {senateVoteList.length} votes loaded — {senateSelected.size} selected
                  </Text>
                  <Space size="small">
                    <Button size="small" onClick={() => { setSenateVoteList([]); setSenateSelected(new Set()); }}>
                      Re-fetch
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      disabled={senateSelected.size === 0}
                      onClick={importSenateVotes}
                    >
                      Import {senateSelected.size} Votes
                    </Button>
                  </Space>
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <Input.Search
                    size="small"
                    placeholder="Search title or bill..."
                    allowClear
                    style={{ width: 220 }}
                    onSearch={setSenateSearch}
                    onChange={(e) => { if (!e.target.value) setSenateSearch(""); }}
                  />
                  <Checkbox checked={senateHideProcedural} onChange={(e) => setSenateHideProcedural(e.target.checked)}>
                    <Text style={{ fontSize: 12 }}>Hide Procedural</Text>
                  </Checkbox>
                  <Checkbox checked={senateHideNominations} onChange={(e) => setSenateHideNominations(e.target.checked)}>
                    <Text style={{ fontSize: 12 }}>Hide Nominations</Text>
                  </Checkbox>
                  <Checkbox checked={senateHideTreaties} onChange={(e) => setSenateHideTreaties(e.target.checked)}>
                    <Text style={{ fontSize: 12 }}>Hide Treaties</Text>
                  </Checkbox>
                </div>

                {/* Bulk select */}
                <div style={{ marginBottom: 8 }}>
                  <Space size="small">
                    <Button
                      size="small"
                      onClick={() => {
                        const visible = getFilteredSenateVotes();
                        setSenateSelected(new Set(visible.map((v) => v.voteNumber)));
                      }}
                    >
                      Select All Visible
                    </Button>
                    <Button size="small" onClick={() => setSenateSelected(new Set())}>
                      Deselect All
                    </Button>
                  </Space>
                </div>

                {/* Vote list table */}
                <Table
                  dataSource={getFilteredSenateVotes()}
                  rowKey="key"
                  size="small"
                  pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (t) => `${t} votes` }}
                  rowSelection={{
                    selectedRowKeys: Array.from(senateSelected),
                    onChange: (keys) => setSenateSelected(new Set(keys as string[])),
                  }}
                  columns={[
                    { title: "#", dataIndex: "voteNumber", key: "num", width: 60 },
                    { title: "Date", dataIndex: "voteDate", key: "date", width: 70 },
                    { title: "Issue", dataIndex: "issue", key: "issue", width: 90 },
                    { title: "Question", dataIndex: "question", key: "q", width: 130, ellipsis: true },
                    {
                      title: "Result",
                      dataIndex: "result",
                      key: "result",
                      width: 80,
                      render: (r: string) => {
                        const color = r === "Passed" || r === "Agreed to" ? "green" : r === "Rejected" ? "red" : "default";
                        return <Tag color={color}>{r}</Tag>;
                      },
                    },
                    { title: "Title", dataIndex: "title", key: "title", ellipsis: true },
                    {
                      title: "Tally",
                      key: "tally",
                      width: 80,
                      render: (_: any, r: SenateVoteListItem) => (
                        <Text style={{ fontSize: 12 }}>{r.yeas}-{r.nays}</Text>
                      ),
                    },
                  ]}
                />
              </div>
            )}
          </>
        )}

        {senateImportStep === "loading" && !senateDetailPasteMode && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>
                Importing vote {senateImportProgress.current} of {senateImportProgress.total}...
              </Text>
            </div>
          </div>
        )}

        {senateImportStep === "loading" && senateDetailPasteMode && (
          <div>
            <Alert
              type="info"
              showIcon
              message={`Paste vote detail XML (${senateDetailPasteIdx + 1} of ${senateDetailPasteQueue.length})`}
              description={
                <>
                  Open{" "}
                  <a
                    href={buildVoteDetailUrl(senateCongress, senateSession, senateDetailPasteQueue[senateDetailPasteIdx])}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Vote #{senateDetailPasteQueue[senateDetailPasteIdx]}
                  </a>
                  {" "}in your browser, select all, copy, and paste below.
                </>
              }
              style={{ marginBottom: 12 }}
            />
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Progress: {senateImportProgress.current} done — {senateImportProgress.imported} imported, {senateImportProgress.skipped} skipped, {senateImportProgress.failed} failed
              </Text>
            </div>
            <TextArea
              rows={8}
              placeholder="Paste the individual vote XML here..."
              value={senateDetailPasteText}
              onChange={(e) => setSenateDetailPasteText(e.target.value)}
            />
            <Space style={{ marginTop: 8 }}>
              <Button
                type="primary"
                disabled={!senateDetailPasteText.trim()}
                onClick={handleSenateDetailPaste}
              >
                Import & Next
              </Button>
              <Button onClick={() => {
                // Skip this vote
                const voteNum = senateDetailPasteQueue[senateDetailPasteIdx];
                const listItem = senateVoteList.find((v) => v.voteNumber === voteNum);
                setSenateImportResults((prev) => [...prev, { voteNumber: voteNum, billName: listItem?.title ?? voteNum, status: "skipped", reason: "Skipped by user" }]);
                setSenateImportProgress((prev) => ({ ...prev, current: prev.current + 1, skipped: prev.skipped + 1 }));
                setSenateDetailPasteText("");
                if (senateDetailPasteIdx + 1 >= senateDetailPasteQueue.length) {
                  setSenateDetailPasteMode(false);
                  setSenateImportStep("done");
                  loadBills();
                } else {
                  setSenateDetailPasteIdx(senateDetailPasteIdx + 1);
                }
              }}>
                Skip
              </Button>
            </Space>

            {/* Show already-imported results */}
            {senateImportResults.length > 0 && (
              <div style={{ marginTop: 16, maxHeight: 200, overflowY: "auto" }}>
                <Divider style={{ margin: "8px 0" }} />
                {senateImportResults.map((r) => (
                  <div key={r.voteNumber} style={{ fontSize: 12, padding: "2px 0" }}>
                    <Tag color={r.status === "imported" ? "green" : r.status === "skipped" ? "orange" : "red"} style={{ fontSize: 11 }}>
                      {r.status}
                    </Tag>
                    {r.billName}
                    {r.reason && <Text type="secondary" style={{ fontSize: 11 }}> — {r.reason}</Text>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {senateImportStep === "done" && (
          <div>
            <Alert
              type="success"
              showIcon
              message="Import Complete"
              description={`${senateImportProgress.imported} imported, ${senateImportProgress.skipped} skipped, ${senateImportProgress.failed} failed`}
              style={{ marginBottom: 16 }}
            />

            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {senateImportResults.map((r) => (
                <div key={r.voteNumber} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <Tag color={r.status === "imported" ? "green" : r.status === "skipped" ? "orange" : "red"}>
                    {r.status}
                  </Tag>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.billName}</div>
                    {r.reason && <Text type="secondary" style={{ fontSize: 12 }}>{r.reason}</Text>}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>#{r.voteNumber}</Text>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <Button onClick={resetSenateImport}>Import More</Button>
              <Button onClick={() => { setSenateDrawerOpen(false); resetSenateImport(); }}>Close</Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Topics Drawer */}
      <Drawer
        title="Manage Topics"
        open={topicsDrawerOpen}
        onClose={() => setTopicsDrawerOpen(false)}
        width={isMobile ? "100%" : 360}
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
