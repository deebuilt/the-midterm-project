import { useState, useCallback, type ReactNode, useEffect } from "react";
import {
  Button,
  Input,
  Select,
  Table,
  Tag,
  Typography,
  Card,
  Space,
  Alert,
  Spin,
  Progress,
  Statistic,
  Row,
  Col,
  Tooltip,
  Badge,
  Divider,
  Checkbox,
  message,
  Modal,
} from "antd";
import {
  ApiOutlined,
  CloudDownloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { supabase } from "../../lib/supabase";
import {
  OpenFecClient,
  parseFecName,
  mapFecParty,
  slugifyName,
  type FecCandidate,
} from "../../lib/openfec";

const { Text, Title, Paragraph } = Typography;

interface FecImportPageProps {
  setHeaderActions: (actions: ReactNode) => void;
}

type ImportStep = "connect" | "preview" | "importing" | "done";
type OfficeFilter = "S" | "H" | "both";

interface PreviewCandidate {
  fec: FecCandidate;
  parsedFirst: string;
  parsedLast: string;
  mappedParty: string;
  slug: string;
  isIncumbent: boolean;
  existsInFilings: boolean;
  existingFilingId: number | null;
  selected: boolean;
  financials: { raised: number; spent: number; cash: number } | null;
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

const STORAGE_KEY = "tmp-fec-api-key";

export default function FecImportPage({ setHeaderActions }: FecImportPageProps) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) ?? "");
  const [step, setStep] = useState<ImportStep>("connect");
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [connectionInfo, setConnectionInfo] = useState("");
  const [cycle, setCycle] = useState(2026);
  const [officeFilter, setOfficeFilter] = useState<OfficeFilter>("S");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [onlyActive, setOnlyActive] = useState(true);
  const [onlyFunded, setOnlyFunded] = useState(true);
  const [majorPartiesOnly, setMajorPartiesOnly] = useState(true);
  const [minFiveK, setMinFiveK] = useState(true);

  const [previewing, setPreviewing] = useState(false);
  const [previewCandidates, setPreviewCandidates] = useState<PreviewCandidate[]>([]);
  const [previewError, setPreviewError] = useState("");

  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [messageApi, contextHolder] = message.useMessage();

  // Clear header actions on mount
  useEffect(() => {
    setHeaderActions(null);
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  // ─── Connection ───

  async function testConnection() {
    if (!apiKey.trim()) {
      messageApi.warning("Enter your OpenFEC API key first");
      return;
    }

    localStorage.setItem(STORAGE_KEY, apiKey.trim());
    setConnectionStatus("testing");

    const client = new OpenFecClient(apiKey.trim());
    const result = await client.testConnection(cycle);

    if (result.ok) {
      setConnectionStatus("ok");
      setConnectionInfo(`API key valid. FEC has ${result.count.toLocaleString()} total Senate filings for ${cycle} (use filters below to narrow down).`);
    } else {
      setConnectionStatus("error");
      setConnectionInfo(`Connection failed: ${result.error}`);
    }
  }

  // ─── Preview ───

  const fetchPreview = useCallback(async () => {
    if (connectionStatus !== "ok") {
      messageApi.warning("Test your connection first");
      return;
    }

    setPreviewing(true);
    setPreviewError("");
    setPreviewCandidates([]);

    try {
      const client = new OpenFecClient(apiKey.trim());
      let candidates: FecCandidate[] = [];

      const fetchParams: any = {
        cycle,
        is_active_candidate: onlyActive ? true : undefined,
        has_raised_funds: onlyFunded ? true : undefined,
        state: stateFilter || undefined,
      };

      if (officeFilter === "S" || officeFilter === "both") {
        const senate = await client.getCandidates({ ...fetchParams, office: "S" });
        candidates.push(...senate);
      }
      if (officeFilter === "H" || officeFilter === "both") {
        const house = await client.getCandidates({ ...fetchParams, office: "H" });
        candidates.push(...house);
      }

      // Filter by major parties if enabled (before building preview)
      const majorParties = new Set(["DEM", "REP", "IND", "NNE", "NPA"]);
      if (majorPartiesOnly) {
        candidates = candidates.filter((c) => majorParties.has(c.party) || !c.party);
      }

      // Deduplicate: same candidate_id can appear if they filed amendments.
      // Also dedupe same person name+state (keeps the one with most recent activity).
      const seenFecIds = new Set<string>();
      const deduped: FecCandidate[] = [];
      for (const c of candidates) {
        if (seenFecIds.has(c.candidate_id)) continue;
        seenFecIds.add(c.candidate_id);
        deduped.push(c);
      }
      candidates = deduped;

      // Get active cycle
      const { data: activeCycle } = await supabase
        .from("election_cycles")
        .select("id")
        .eq("is_active", true)
        .single();

      if (!activeCycle) {
        setPreviewError("No active election cycle found. Create one first.");
        setPreviewing(false);
        return;
      }

      // Get existing filings from DB to mark duplicates
      const { data: existingFilings } = await supabase
        .from("fec_filings")
        .select("id, fec_candidate_id")
        .eq("cycle_id", activeCycle.id);

      const fecIdMap = new Map<string, number>();
      for (const ef of existingFilings ?? []) {
        if (ef.fec_candidate_id) fecIdMap.set(ef.fec_candidate_id, ef.id);
      }

      const preview: PreviewCandidate[] = candidates.map((fec) => {
        const { first, last } = parseFecName(fec.name);
        const slug = slugifyName(first, last);
        const existingFilingId = fecIdMap.get(fec.candidate_id) ?? null;

        return {
          fec,
          parsedFirst: first,
          parsedLast: last,
          mappedParty: mapFecParty(fec.party_full),
          slug,
          isIncumbent: fec.incumbent_challenge === "I",
          existsInFilings: existingFilingId !== null,
          existingFilingId,
          selected: !existingFilingId, // auto-select new filings
          financials: null,
        };
      });

      // Sort: new first, then by state, then by name
      preview.sort((a, b) => {
        if (a.existsInFilings !== b.existsInFilings) return a.existsInFilings ? 1 : -1;
        const stateCompare = a.fec.state.localeCompare(b.fec.state);
        if (stateCompare !== 0) return stateCompare;
        return a.parsedLast.localeCompare(b.parsedLast);
      });

      // Fetch financials (always enabled for filings - we need this for the public page)
      setImportStatus(`Fetching financials for ${preview.length} candidates...`);
      for (let i = 0; i < preview.length; i++) {
        const item = preview[i];
        setImportProgress(Math.round(((i + 1) / preview.length) * 100));
        setImportStatus(`Fetching financials: ${item.parsedFirst} ${item.parsedLast} (${i + 1}/${preview.length})`);
        try {
          const totals = await client.getCandidateTotals(item.fec.candidate_id, cycle);
          if (totals) {
            item.financials = {
              raised: totals.receipts ?? 0,
              spent: totals.disbursements ?? 0,
              cash: totals.cash_on_hand_end_period ?? 0,
            };
          }
        } catch {
          // Non-fatal — just leave financials null
        }
      }
      setImportStatus("");
      setImportProgress(0);

      // Filter by min $5K if enabled
      let filtered = preview;
      if (minFiveK) {
        filtered = preview.filter((p) => (p.financials?.raised ?? 0) >= 5000);
      }

      setPreviewCandidates(filtered);
      setStep("preview");
    } catch (err: any) {
      setPreviewError(err.message);
    } finally {
      setPreviewing(false);
    }
  }, [apiKey, cycle, officeFilter, stateFilter, onlyActive, onlyFunded, majorPartiesOnly, minFiveK, connectionStatus, messageApi]);

  // ─── Import ───

  async function runImport() {
    const selected = previewCandidates.filter((p) => p.selected);
    if (selected.length === 0) {
      messageApi.warning("Select at least one candidate to sync");
      return;
    }

    Modal.confirm({
      title: `Sync ${selected.length} filings?`,
      content: (
        <div>
          <p>This will:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Create {selected.filter((s) => !s.existsInFilings).length} new filing records</li>
            <li>Update {selected.filter((s) => s.existsInFilings).length} existing filings (FEC ID + financials)</li>
            <li>Store data in the staging table (not live candidates table)</li>
          </ul>
          <p>After primaries, promote winners to the candidates table from the Filed Candidates page.</p>
        </div>
      ),
      okText: "Sync to Filings",
      onOk: () => executeImport(selected),
    });
  }

  async function executeImport(selected: PreviewCandidate[]) {
    setStep("importing");
    setImporting(true);
    setImportProgress(0);
    setImportStatus("Starting sync...");

    const result: ImportResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    try {
      // Get active cycle
      const { data: activeCycle } = await supabase
        .from("election_cycles")
        .select("id")
        .eq("is_active", true)
        .single();

      if (!activeCycle) {
        result.errors.push("No active election cycle found. Create one first.");
        setImportResult(result);
        setStep("done");
        return;
      }

      // Get states lookup
      const { data: states } = await supabase.from("states").select("id, abbr");
      const stateMap = new Map<string, number>();
      for (const s of states ?? []) stateMap.set(s.abbr, s.id);

      // Process filings
      const total = selected.length;
      for (let i = 0; i < selected.length; i++) {
        const item = selected[i];
        const pct = Math.round(((i + 1) / total) * 100);
        setImportProgress(pct);
        setImportStatus(`Processing ${item.parsedFirst} ${item.parsedLast} (${i + 1}/${total})`);

        const stateId = stateMap.get(item.fec.state);
        if (!stateId) {
          result.errors.push(`Unknown state: ${item.fec.state} for ${item.parsedFirst} ${item.parsedLast}`);
          result.skipped++;
          continue;
        }

        // Prepare upsert payload
        const upsertPayload = {
          fec_candidate_id: item.fec.candidate_id,
          cycle_id: activeCycle.id,
          state_id: stateId,
          name: item.fec.name,
          first_name: item.parsedFirst,
          last_name: item.parsedLast,
          party: item.mappedParty,
          office: item.fec.office,
          district_number: item.fec.office === "H" ? parseInt(item.fec.district, 10) : null,
          is_incumbent: item.isIncumbent,
          funds_raised: item.financials?.raised ?? null,
          funds_spent: item.financials?.spent ?? null,
          cash_on_hand: item.financials?.cash ?? null,
          last_synced_at: new Date().toISOString(),
        };

        // Upsert into fec_filings
        const { error } = await supabase
          .from("fec_filings")
          .upsert(upsertPayload, {
            onConflict: "cycle_id,fec_candidate_id",
          })
          .select("id")
          .single();

        if (error) {
          result.errors.push(`Sync error for ${item.parsedFirst} ${item.parsedLast}: ${error.message}`);
          result.skipped++;
          continue;
        }

        // Determine if this was a create or update
        if (item.existsInFilings) {
          result.updated++;
        } else {
          result.created++;
        }
      }
    } catch (err: any) {
      result.errors.push(`Fatal error: ${err.message}`);
    }

    setImportResult(result);
    setImporting(false);
    setStep("done");
  }

  // ─── Selection helpers ───

  function toggleAll(checked: boolean) {
    setPreviewCandidates((prev) =>
      prev.map((p) => ({ ...p, selected: checked }))
    );
  }

  function toggleCandidate(index: number) {
    setPreviewCandidates((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
    );
  }

  // ─── Render ───

  const newCount = previewCandidates.filter((p) => !p.existsInFilings).length;
  const existingCount = previewCandidates.filter((p) => p.existsInFilings).length;
  const selectedCount = previewCandidates.filter((p) => p.selected).length;

  return (
    <div>
      {contextHolder}

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message="OpenFEC Integration"
        description={
          <span>
            Sync FEC filings to staging table. After primaries, promote winners to the candidates table from the Filed Candidates page.
            {" "}
            <a href="https://api.open.fec.gov/developers/" target="_blank" rel="noopener noreferrer">
              Get a free API key
            </a>
          </span>
        }
        style={{ marginBottom: 20 }}
      />

      {/* Step 1: Connect */}
      <Card
        title={
          <Space>
            <ApiOutlined />
            <span>API Connection</span>
            {connectionStatus === "ok" && (
              <Tag color="success" icon={<CheckCircleOutlined />}>Connected</Tag>
            )}
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <Input.Password
            placeholder="OpenFEC API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ flex: 1 }}
            onPressEnter={testConnection}
          />
          <Button
            onClick={testConnection}
            loading={connectionStatus === "testing"}
            icon={<ThunderboltOutlined />}
          >
            Test
          </Button>
        </div>

        {connectionStatus === "ok" && (
          <Text type="success" style={{ fontSize: 13 }}>
            <CheckCircleOutlined /> {connectionInfo}
          </Text>
        )}
        {connectionStatus === "error" && (
          <Text type="danger" style={{ fontSize: 13 }}>
            <ExclamationCircleOutlined /> {connectionInfo}
          </Text>
        )}
      </Card>

      {/* Step 2: Fetch & Filter */}
      {connectionStatus === "ok" && (
        <Card
          title={
            <Space>
              <CloudDownloadOutlined />
              <span>Fetch Candidates</span>
            </Space>
          }
          size="small"
          style={{ marginBottom: 16 }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12, alignItems: "flex-end" }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Cycle</Text>
              <Select
                value={cycle}
                onChange={setCycle}
                style={{ width: 100 }}
                options={[
                  { value: 2026, label: "2026" },
                  { value: 2024, label: "2024" },
                  { value: 2028, label: "2028" },
                ]}
              />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Office</Text>
              <Select
                value={officeFilter}
                onChange={setOfficeFilter}
                style={{ width: 140 }}
                options={[
                  { value: "S", label: "Senate only" },
                  { value: "H", label: "House only" },
                  { value: "both", label: "Senate + House" },
                ]}
              />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>State</Text>
              <Select
                placeholder="All states"
                value={stateFilter || undefined}
                onChange={(val) => setStateFilter(val ?? "")}
                allowClear
                showSearch
                style={{ width: 140 }}
                options={[
                  { value: "AL", label: "AL — Alabama" },
                  { value: "AK", label: "AK — Alaska" },
                  { value: "AZ", label: "AZ — Arizona" },
                  { value: "AR", label: "AR — Arkansas" },
                  { value: "CA", label: "CA — California" },
                  { value: "CO", label: "CO — Colorado" },
                  { value: "CT", label: "CT — Connecticut" },
                  { value: "DE", label: "DE — Delaware" },
                  { value: "FL", label: "FL — Florida" },
                  { value: "GA", label: "GA — Georgia" },
                  { value: "HI", label: "HI — Hawaii" },
                  { value: "ID", label: "ID — Idaho" },
                  { value: "IL", label: "IL — Illinois" },
                  { value: "IN", label: "IN — Indiana" },
                  { value: "IA", label: "IA — Iowa" },
                  { value: "KS", label: "KS — Kansas" },
                  { value: "KY", label: "KY — Kentucky" },
                  { value: "LA", label: "LA — Louisiana" },
                  { value: "ME", label: "ME — Maine" },
                  { value: "MD", label: "MD — Maryland" },
                  { value: "MA", label: "MA — Massachusetts" },
                  { value: "MI", label: "MI — Michigan" },
                  { value: "MN", label: "MN — Minnesota" },
                  { value: "MS", label: "MS — Mississippi" },
                  { value: "MO", label: "MO — Missouri" },
                  { value: "MT", label: "MT — Montana" },
                  { value: "NE", label: "NE — Nebraska" },
                  { value: "NV", label: "NV — Nevada" },
                  { value: "NH", label: "NH — New Hampshire" },
                  { value: "NJ", label: "NJ — New Jersey" },
                  { value: "NM", label: "NM — New Mexico" },
                  { value: "NY", label: "NY — New York" },
                  { value: "NC", label: "NC — North Carolina" },
                  { value: "ND", label: "ND — North Dakota" },
                  { value: "OH", label: "OH — Ohio" },
                  { value: "OK", label: "OK — Oklahoma" },
                  { value: "OR", label: "OR — Oregon" },
                  { value: "PA", label: "PA — Pennsylvania" },
                  { value: "RI", label: "RI — Rhode Island" },
                  { value: "SC", label: "SC — South Carolina" },
                  { value: "SD", label: "SD — South Dakota" },
                  { value: "TN", label: "TN — Tennessee" },
                  { value: "TX", label: "TX — Texas" },
                  { value: "UT", label: "UT — Utah" },
                  { value: "VT", label: "VT — Vermont" },
                  { value: "VA", label: "VA — Virginia" },
                  { value: "WA", label: "WA — Washington" },
                  { value: "WV", label: "WV — West Virginia" },
                  { value: "WI", label: "WI — Wisconsin" },
                  { value: "WY", label: "WY — Wyoming" },
                  { value: "DC", label: "DC — District of Columbia" },
                ]}
              />
            </div>
            <div style={{ display: "flex", gap: 16, paddingBottom: 4, flexWrap: "wrap" }}>
              <Checkbox checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)}>
                Active only
              </Checkbox>
              <Checkbox checked={onlyFunded} onChange={(e) => setOnlyFunded(e.target.checked)}>
                <Tooltip title="Filters out ~80% of filings — people who registered but never raised money">
                  <span style={{ borderBottom: "1px dashed #999" }}>Has raised funds</span>
                </Tooltip>
              </Checkbox>
              <Checkbox checked={majorPartiesOnly} onChange={(e) => setMajorPartiesOnly(e.target.checked)}>
                <Tooltip title="Democrat, Republican, and Independent only — skips fringe parties">
                  <span style={{ borderBottom: "1px dashed #999" }}>Major parties only</span>
                </Tooltip>
              </Checkbox>
              <Checkbox checked={minFiveK} onChange={(e) => setMinFiveK(e.target.checked)}>
                <Tooltip title="Only show candidates who have raised at least $5,000 — filters out non-serious campaigns">
                  <span style={{ borderBottom: "1px dashed #999" }}>Min $5K raised</span>
                </Tooltip>
              </Checkbox>
            </div>
          </div>

          <Button
            type="primary"
            icon={<CloudDownloadOutlined />}
            onClick={fetchPreview}
            loading={previewing}
          >
            Fetch from FEC
          </Button>

          {previewing && importStatus && (
            <div style={{ marginTop: 12 }}>
              <Progress percent={importProgress} size="small" status="active" />
              <Text type="secondary" style={{ fontSize: 12 }}>{importStatus}</Text>
            </div>
          )}

          {previewError && (
            <Alert
              type="error"
              message={previewError}
              style={{ marginTop: 12 }}
              closable
              onClose={() => setPreviewError("")}
            />
          )}
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && previewCandidates.length > 0 && (
        <Card
          title={
            <Space>
              <span>Preview ({previewCandidates.length} candidates)</span>
              <Badge count={newCount} style={{ backgroundColor: "#52c41a" }} title={`${newCount} new`} />
              {existingCount > 0 && (
                <Badge count={existingCount} style={{ backgroundColor: "#faad14" }} title={`${existingCount} already in filings`} />
              )}
            </Space>
          }
          size="small"
          style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Text type="secondary" style={{ fontSize: 12 }}>{selectedCount} selected</Text>
              <Button size="small" onClick={() => toggleAll(true)}>Select All</Button>
              <Button size="small" onClick={() => toggleAll(false)}>Deselect All</Button>
              <Button
                size="small"
                onClick={() =>
                  setPreviewCandidates((prev) =>
                    prev.map((p) => ({ ...p, selected: !p.existsInFilings }))
                  )
                }
              >
                New Only
              </Button>
              <Divider type="vertical" />
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={runImport}
                disabled={selectedCount === 0}
              >
                Sync to Filings ({selectedCount})
              </Button>
            </Space>
          }
        >
          <Table
            dataSource={previewCandidates}
            rowKey={(_, i) => String(i)}
            size="small"
            pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (t) => `${t} candidates` }}
            scroll={{ x: 1100 }}
            columns={[
              {
                title: "",
                key: "select",
                width: 40,
                render: (_, __, index) => (
                  <Checkbox
                    checked={previewCandidates[index].selected}
                    onChange={() => toggleCandidate(index)}
                  />
                ),
              },
              {
                title: "Status",
                key: "status",
                width: 80,
                filters: [
                  { text: "New", value: "new" },
                  { text: "Exists", value: "exists" },
                ],
                onFilter: (value, record) =>
                  value === "new" ? !record.existsInFilings : record.existsInFilings,
                render: (_, record: PreviewCandidate) =>
                  record.existsInFilings ? (
                    <Tag color="warning">In Filings</Tag>
                  ) : (
                    <Tag color="success">New</Tag>
                  ),
              },
              {
                title: "Name",
                key: "name",
                sorter: (a: PreviewCandidate, b: PreviewCandidate) =>
                  a.parsedLast.localeCompare(b.parsedLast),
                render: (_, record: PreviewCandidate) => (
                  <div>
                    <Text strong>{record.parsedFirst} {record.parsedLast}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      FEC: {record.fec.name}
                    </Text>
                  </div>
                ),
              },
              {
                title: "Party",
                key: "party",
                width: 100,
                filters: [
                  { text: "Democrat", value: "Democrat" },
                  { text: "Republican", value: "Republican" },
                  { text: "Other", value: "other" },
                ],
                onFilter: (value, record: PreviewCandidate) =>
                  value === "other"
                    ? !["Democrat", "Republican"].includes(record.mappedParty)
                    : record.mappedParty === value,
                render: (_, record: PreviewCandidate) => {
                  const colors: Record<string, string> = {
                    Democrat: "blue",
                    Republican: "red",
                    Independent: "purple",
                    Libertarian: "gold",
                    Green: "green",
                  };
                  return <Tag color={colors[record.mappedParty] ?? "default"}>{record.mappedParty}</Tag>;
                },
              },
              {
                title: "Office",
                key: "office",
                width: 120,
                filters: [
                  { text: "Senate", value: "S" },
                  { text: "House", value: "H" },
                ],
                onFilter: (value, record: PreviewCandidate) => record.fec.office === value,
                render: (_, record: PreviewCandidate) => (
                  <span>
                    {record.fec.office === "S" ? "Senate" : "House"}
                    {record.fec.office === "H" && ` (${record.fec.state}-${record.fec.district})`}
                  </span>
                ),
              },
              {
                title: "State",
                dataIndex: ["fec", "state"],
                key: "state",
                width: 60,
                sorter: (a: PreviewCandidate, b: PreviewCandidate) =>
                  a.fec.state.localeCompare(b.fec.state),
              },
              {
                title: "Type",
                key: "type",
                width: 90,
                render: (_, record: PreviewCandidate) => {
                  if (record.fec.incumbent_challenge === "I") return <Tag color="green">Incumbent</Tag>;
                  if (record.fec.incumbent_challenge === "C") return <Tag>Challenger</Tag>;
                  return <Tag color="orange">Open</Tag>;
                },
              },
              {
                title: "Raised",
                key: "raised",
                width: 90,
                sorter: (a: PreviewCandidate, b: PreviewCandidate) =>
                  (a.financials?.raised ?? 0) - (b.financials?.raised ?? 0),
                render: (_: unknown, record: PreviewCandidate) =>
                  record.financials ? (
                    <Text style={{ fontSize: 12, fontFamily: "monospace" }}>
                      ${record.financials.raised >= 1_000_000 ? `${(record.financials.raised / 1_000_000).toFixed(1)}M` : record.financials.raised >= 1_000 ? `${(record.financials.raised / 1_000).toFixed(0)}K` : record.financials.raised.toFixed(0)}
                    </Text>
                  ) : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
              },
              {
                title: "Spent",
                key: "spent",
                width: 90,
                sorter: (a: PreviewCandidate, b: PreviewCandidate) =>
                  (a.financials?.spent ?? 0) - (b.financials?.spent ?? 0),
                render: (_: unknown, record: PreviewCandidate) =>
                  record.financials ? (
                    <Text style={{ fontSize: 12, fontFamily: "monospace" }}>
                      ${record.financials.spent >= 1_000_000 ? `${(record.financials.spent / 1_000_000).toFixed(1)}M` : record.financials.spent >= 1_000 ? `${(record.financials.spent / 1_000).toFixed(0)}K` : record.financials.spent.toFixed(0)}
                    </Text>
                  ) : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
              },
              {
                title: "Cash",
                key: "cash",
                width: 90,
                sorter: (a: PreviewCandidate, b: PreviewCandidate) =>
                  (a.financials?.cash ?? 0) - (b.financials?.cash ?? 0),
                render: (_: unknown, record: PreviewCandidate) =>
                  record.financials ? (
                    <Text style={{ fontSize: 12, fontFamily: "monospace" }}>
                      ${record.financials.cash >= 1_000_000 ? `${(record.financials.cash / 1_000_000).toFixed(1)}M` : record.financials.cash >= 1_000 ? `${(record.financials.cash / 1_000).toFixed(0)}K` : record.financials.cash.toFixed(0)}
                    </Text>
                  ) : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
              },
              {
                title: "FEC ID",
                dataIndex: ["fec", "candidate_id"],
                key: "fec_id",
                width: 110,
                render: (id: string) => (
                  <Tooltip title="View on FEC.gov">
                    <a
                      href={`https://www.fec.gov/data/candidate/${id}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontFamily: "monospace", fontSize: 12 }}
                    >
                      {id}
                    </a>
                  </Tooltip>
                ),
              },
            ]}
          />
        </Card>
      )}

      {step === "preview" && previewCandidates.length === 0 && !previewing && (
        <Alert
          type="warning"
          message="No candidates found"
          description="Try adjusting your filters. Make sure the cycle year is correct and the state code is valid."
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Step 4: Importing */}
      {step === "importing" && (
        <Card style={{ marginBottom: 16, textAlign: "center", padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 20 }}>
            <Progress percent={importProgress} status="active" />
            <Text style={{ display: "block", marginTop: 8 }}>{importStatus}</Text>
          </div>
        </Card>
      )}

      {/* Step 5: Done */}
      {step === "done" && importResult && (
        <Card
          title="Sync Complete"
          style={{ marginBottom: 16 }}
        >
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={8}>
              <Statistic
                title="Created"
                value={importResult.created}
                valueStyle={{ color: "#52c41a" }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Updated"
                value={importResult.updated}
                valueStyle={{ color: "#1890ff" }}
                prefix={<SyncOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic title="Skipped" value={importResult.skipped} />
            </Col>
          </Row>

          {importResult.errors.length > 0 && (
            <Alert
              type="warning"
              message={`${importResult.errors.length} issues`}
              description={
                <ul style={{ maxHeight: 200, overflow: "auto", paddingLeft: 20, margin: 0 }}>
                  {importResult.errors.map((e, i) => (
                    <li key={i} style={{ fontSize: 12 }}>{e}</li>
                  ))}
                </ul>
              }
              style={{ marginBottom: 12 }}
            />
          )}

          <Space>
            <Button
              type="primary"
              onClick={() => {
                setStep("connect");
                setPreviewCandidates([]);
                setImportResult(null);
              }}
            >
              Sync More
            </Button>
            <Button onClick={() => window.location.hash = "filings"}>
              View Filed Candidates
            </Button>
          </Space>
        </Card>
      )}
    </div>
  );
}
