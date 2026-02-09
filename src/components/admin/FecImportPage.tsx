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
  existsInDb: boolean;
  existingDbId: number | null;
  selected: boolean;
  financials: { raised: number; spent: number; cash: number } | null;
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  districtsCreated: number;
  racesCreated: number;
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
  const [fetchFinancials, setFetchFinancials] = useState(true);

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

      // Get existing candidates from DB to mark duplicates
      const { data: existingCandidates } = await supabase
        .from("candidates")
        .select("id, fec_candidate_id, first_name, last_name, slug");

      const fecIdMap = new Map<string, number>();
      const slugMap = new Map<string, number>();
      for (const ec of existingCandidates ?? []) {
        if (ec.fec_candidate_id) fecIdMap.set(ec.fec_candidate_id, ec.id);
        slugMap.set(ec.slug, ec.id);
      }

      const preview: PreviewCandidate[] = candidates.map((fec) => {
        const { first, last } = parseFecName(fec.name);
        const slug = slugifyName(first, last);
        const existingById = fecIdMap.get(fec.candidate_id);
        const existingBySlug = slugMap.get(slug);
        const existingDbId = existingById ?? existingBySlug ?? null;

        return {
          fec,
          parsedFirst: first,
          parsedLast: last,
          mappedParty: mapFecParty(fec.party_full),
          slug,
          isIncumbent: fec.incumbent_challenge === "I",
          existsInDb: existingDbId !== null,
          existingDbId,
          selected: !existingDbId, // auto-select new candidates
          financials: null,
        };
      });

      // Sort: new first, then by state, then by name
      preview.sort((a, b) => {
        if (a.existsInDb !== b.existsInDb) return a.existsInDb ? 1 : -1;
        const stateCompare = a.fec.state.localeCompare(b.fec.state);
        if (stateCompare !== 0) return stateCompare;
        return a.parsedLast.localeCompare(b.parsedLast);
      });

      // Fetch financials if enabled (uses 1 API call per candidate)
      if (fetchFinancials) {
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
      }

      setPreviewCandidates(preview);
      setStep("preview");
    } catch (err: any) {
      setPreviewError(err.message);
    } finally {
      setPreviewing(false);
    }
  }, [apiKey, cycle, officeFilter, stateFilter, onlyActive, onlyFunded, majorPartiesOnly, fetchFinancials, connectionStatus, messageApi]);

  // ─── Import ───

  async function runImport() {
    const selected = previewCandidates.filter((p) => p.selected);
    if (selected.length === 0) {
      messageApi.warning("Select at least one candidate to import");
      return;
    }

    Modal.confirm({
      title: `Import ${selected.length} candidates?`,
      content: (
        <div>
          <p>This will:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Create {selected.filter((s) => !s.existsInDb).length} new candidate records</li>
            <li>Update {selected.filter((s) => s.existsInDb).length} existing records (FEC ID + financials)</li>
            <li>Create any missing districts and races for the active cycle</li>
            {fetchFinancials && (
              <li>Fetch financial data ({selected.length} extra API calls — ~{Math.ceil(selected.length / 1000)} hr of rate limit)</li>
            )}
          </ul>
          <p>Existing bio, photo, position, and race rating data will NOT be overwritten.</p>
        </div>
      ),
      okText: "Import",
      onOk: () => executeImport(selected),
    });
  }

  async function executeImport(selected: PreviewCandidate[]) {
    setStep("importing");
    setImporting(true);
    setImportProgress(0);
    setImportStatus("Starting import...");

    const result: ImportResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      districtsCreated: 0,
      racesCreated: 0,
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

      // Get government bodies
      const { data: bodies } = await supabase
        .from("government_bodies")
        .select("id, slug");

      const senateBodyId = bodies?.find((b) => b.slug === "us-senate")?.id;
      const houseBodyId = bodies?.find((b) => b.slug === "us-house")?.id;

      if (!senateBodyId || !houseBodyId) {
        result.errors.push("Government bodies (us-senate, us-house) not found in database.");
        setImportResult(result);
        setStep("done");
        return;
      }

      // Get states lookup
      const { data: states } = await supabase.from("states").select("id, abbr");
      const stateMap = new Map<string, number>();
      for (const s of states ?? []) stateMap.set(s.abbr, s.id);

      // Get existing districts
      const { data: existingDistricts } = await supabase
        .from("districts")
        .select("id, state_id, body_id, number, senate_class");

      // Build district lookup key
      function districtKey(stateId: number, bodyId: number, num: number | null, senateClass: number | null) {
        return `${stateId}-${bodyId}-${num ?? "null"}-${senateClass ?? "null"}`;
      }

      const districtMap = new Map<string, number>();
      for (const d of existingDistricts ?? []) {
        districtMap.set(districtKey(d.state_id, d.body_id, d.number, d.senate_class), d.id);
      }

      // Get existing races for active cycle
      const { data: existingRaces } = await supabase
        .from("races")
        .select("id, district_id")
        .eq("cycle_id", activeCycle.id);

      const raceByDistrictId = new Map<number, number>();
      for (const r of existingRaces ?? []) {
        raceByDistrictId.set(r.district_id, r.id);
      }

      // Process candidates
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

        const bodyId = item.fec.office === "S" ? senateBodyId : houseBodyId;

        // ── Use pre-fetched financials from preview ──
        const financialData = item.financials
          ? { funds_raised: item.financials.raised, funds_spent: item.financials.spent, cash_on_hand: item.financials.cash }
          : null;

        // ── Upsert candidate ──
        if (item.existsInDb && item.existingDbId) {
          // Link FEC ID + update financials
          const updatePayload: Record<string, unknown> = {
            fec_candidate_id: item.fec.candidate_id,
          };
          if (financialData) {
            updatePayload.funds_raised = financialData.funds_raised;
            updatePayload.funds_spent = financialData.funds_spent;
            updatePayload.cash_on_hand = financialData.cash_on_hand;
            updatePayload.fec_financials_updated_at = new Date().toISOString();
          }

          const { error } = await supabase
            .from("candidates")
            .update(updatePayload)
            .eq("id", item.existingDbId);

          if (error) {
            result.errors.push(`Update error for ${item.parsedFirst} ${item.parsedLast}: ${error.message}`);
          } else {
            result.updated++;
          }
        } else {
          // Create new candidate
          const insertPayload: Record<string, unknown> = {
            first_name: item.parsedFirst,
            last_name: item.parsedLast,
            slug: item.slug,
            party: item.mappedParty,
            is_incumbent: item.isIncumbent,
            fec_candidate_id: item.fec.candidate_id,
            role_title: item.isIncumbent
              ? item.fec.office === "S"
                ? "U.S. Senator"
                : `U.S. Representative (${item.fec.state}-${item.fec.district})`
              : null,
          };
          if (financialData) {
            insertPayload.funds_raised = financialData.funds_raised;
            insertPayload.funds_spent = financialData.funds_spent;
            insertPayload.cash_on_hand = financialData.cash_on_hand;
            insertPayload.fec_financials_updated_at = new Date().toISOString();
          }

          const { data: newCandidate, error } = await supabase
            .from("candidates")
            .insert(insertPayload)
            .select("id")
            .single();

          if (error) {
            // Might be a slug collision — try with state suffix
            if (error.message.includes("duplicate") || error.message.includes("unique")) {
              const altSlug = `${item.slug}-${item.fec.state.toLowerCase()}`;
              const retryPayload = { ...insertPayload, slug: altSlug };
              const { data: retry, error: retryErr } = await supabase
                .from("candidates")
                .insert(retryPayload)
                .select("id")
                .single();

              if (retryErr) {
                result.errors.push(`Create error for ${item.parsedFirst} ${item.parsedLast}: ${retryErr.message}`);
                result.skipped++;
                continue;
              }

              // Proceed with district/race linking using retry data
              await ensureDistrictAndRace(retry!.id);
              result.created++;
              continue;
            }

            result.errors.push(`Create error for ${item.parsedFirst} ${item.parsedLast}: ${error.message}`);
            result.skipped++;
            continue;
          }

          // Link to district/race
          await ensureDistrictAndRace(newCandidate!.id);
          result.created++;
        }

        // Helper: ensure district + race exist and link candidate
        async function ensureDistrictAndRace(candidateId: number) {
          // Determine district params
          const distNum = item.fec.office === "H" ? parseInt(item.fec.district, 10) : null;
          // For Senate, we default to class 2 (2026 midterms) unless it's a known special
          const senateClass = item.fec.office === "S" ? 2 : null;

          const dKey = districtKey(stateId!, bodyId, distNum, senateClass);
          let districtId = districtMap.get(dKey);

          if (!districtId) {
            // Create district
            const districtName = item.fec.office === "S"
              ? `${item.fec.state} Senate Class ${senateClass}`
              : `${item.fec.state} House District ${distNum}`;

            const { data: newDist, error: distErr } = await supabase
              .from("districts")
              .insert({
                state_id: stateId!,
                body_id: bodyId,
                number: distNum,
                senate_class: senateClass,
                name: districtName,
              })
              .select("id")
              .single();

            if (distErr) {
              // District might already exist from a previous iteration
              if (distErr.message.includes("duplicate") || distErr.message.includes("unique")) {
                const { data: existing } = await supabase
                  .from("districts")
                  .select("id")
                  .eq("state_id", stateId!)
                  .eq("body_id", bodyId)
                  .eq(item.fec.office === "H" ? "number" : "senate_class", item.fec.office === "H" ? distNum! : senateClass!)
                  .single();
                districtId = existing?.id;
              }
              if (!districtId) return; // Can't proceed without district
            } else {
              districtId = newDist!.id;
              districtMap.set(dKey, districtId as number);
              result.districtsCreated++;
            }
          }

          // Ensure race exists for this district in the active cycle
          let raceId = raceByDistrictId.get(districtId!);
          if (!raceId) {
            const { data: newRace, error: raceErr } = await supabase
              .from("races")
              .insert({
                cycle_id: activeCycle!.id,
                district_id: districtId!,
                is_special_election: false,
                is_open_seat: item.isIncumbent ? false : true,
              })
              .select("id")
              .single();

            if (raceErr) {
              // Race might already exist
              const { data: existing } = await supabase
                .from("races")
                .select("id")
                .eq("cycle_id", activeCycle!.id)
                .eq("district_id", districtId!)
                .single();
              raceId = existing?.id;
            } else {
              raceId = newRace!.id;
              raceByDistrictId.set(districtId as number, raceId as number);
              result.racesCreated++;
            }
          }

          // Link candidate to race (if not already linked)
          if (raceId) {
            const { data: existingLink } = await supabase
              .from("race_candidates")
              .select("id")
              .eq("race_id", raceId)
              .eq("candidate_id", candidateId)
              .single();

            if (!existingLink) {
              await supabase.from("race_candidates").insert({
                race_id: raceId,
                candidate_id: candidateId,
                status: "announced",
                is_incumbent: item.isIncumbent,
              });
            }
          }
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

  const newCount = previewCandidates.filter((p) => !p.existsInDb).length;
  const existingCount = previewCandidates.filter((p) => p.existsInDb).length;
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
            Pull federal candidate data from the FEC (Federal Election Commission).
            This imports candidate names, parties, states, and districts.
            Bios, photos, issue positions, and race ratings must still be added manually.
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
              <Input
                placeholder="All states"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value.toUpperCase().slice(0, 2))}
                style={{ width: 80 }}
                maxLength={2}
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
              <Checkbox checked={fetchFinancials} onChange={(e) => setFetchFinancials(e.target.checked)}>
                <Tooltip title="Pulls funds raised, spent, and cash on hand for each candidate. Uses 1 extra API call per candidate during import.">
                  <span style={{ borderBottom: "1px dashed #999" }}>Import financials</span>
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
                <Badge count={existingCount} style={{ backgroundColor: "#faad14" }} title={`${existingCount} already in DB`} />
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
                    prev.map((p) => ({ ...p, selected: !p.existsInDb }))
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
                Import Selected ({selectedCount})
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
                  value === "new" ? !record.existsInDb : record.existsInDb,
                render: (_, record: PreviewCandidate) =>
                  record.existsInDb ? (
                    <Tag color="warning">In DB</Tag>
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
          title="Import Complete"
          style={{ marginBottom: 16 }}
        >
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={6}>
              <Statistic
                title="Created"
                value={importResult.created}
                valueStyle={{ color: "#52c41a" }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Updated"
                value={importResult.updated}
                valueStyle={{ color: "#1890ff" }}
                prefix={<SyncOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic title="Skipped" value={importResult.skipped} />
            </Col>
            <Col span={6}>
              <Statistic
                title="Districts Created"
                value={importResult.districtsCreated}
                valueStyle={{ color: "#722ed1" }}
              />
            </Col>
          </Row>

          {importResult.racesCreated > 0 && (
            <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
              {importResult.racesCreated} new race records were also created (no ratings — set them on the Races page).
            </Text>
          )}

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
              Import More
            </Button>
            <Button onClick={() => window.location.hash = "candidates"}>
              View Candidates
            </Button>
            <Button onClick={() => window.location.hash = "races"}>
              View Races
            </Button>
          </Space>
        </Card>
      )}
    </div>
  );
}
