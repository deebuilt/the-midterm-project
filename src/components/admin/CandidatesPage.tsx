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
  Tabs,
  Avatar,
  Popconfirm,
  Tooltip,
  Divider,
  Dropdown,
  message,
  Spin,
  Alert,
  Card,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  MoreOutlined,
  TeamOutlined,
  LeftOutlined,
  RightOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { supabase } from "../../lib/supabase";
import { useIsMobile } from "./useIsMobile";
import { ResizableDrawer } from "./ResizableDrawer";
import type { Party, Stance, CandidateStatus } from "../../lib/database.types";

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
  body_id: number | null;
  is_incumbent: boolean;
  is_retiring: boolean;
  term_start_year: number | null;
  bioguide_id: string | null;
  fec_candidate_id: string | null;
  govtrack_url: string | null;
  funds_raised: number | null;
  funds_spent: number | null;
  cash_on_hand: number | null;
  state_id: number | null;
  created_at: string;
  updated_at: string;
  // Loaded separately and merged in
  state_abbr?: string | null;
  body_name?: string | null;
  body_member_title?: string | null;
  race_id?: number | null;
  race_label?: string | null;
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

interface RaceOption {
  id: number;
  cycle_name: string;
  state_abbr: string;
  state_name: string;
  body_name: string;
  district_name: string;
  rating: string | null;
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
  const [displayedCandidates, setDisplayedCandidates] = useState<CandidateRow[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CandidateRow | null>(null);
  // Drawer navigation: index-based with ID tracking for stability across reloads
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [detailCandidateId, setDetailCandidateId] = useState<number | null>(null);
  const [positions, setPositions] = useState<CandidatePosition[]>([]);
  const [races, setRaces] = useState<CandidateRaceInfo[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoError, setPhotoError] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<number | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const [allRaces, setAllRaces] = useState<RaceOption[]>([]);
  const [bodyOptions, setBodyOptions] = useState<{ value: number; label: string }[]>([]);
  const [racesLoading, setRacesLoading] = useState(false);
  const [bulkAssignRaceId, setBulkAssignRaceId] = useState<number | null>(null);
  const [bulkAssignStatus, setBulkAssignStatus] = useState<CandidateStatus>("announced");
  const [bulkAssignIncumbent, setBulkAssignIncumbent] = useState(false);
  // Controlled table filter/sorter state — survives data reloads
  const [tableFilters, setTableFilters] = useState<Record<string, any[] | null>>({});
  const [tableSorter, setTableSorter] = useState<{ field?: string; order?: "ascend" | "descend" } | null>(null);
  const [tablePagination, setTablePagination] = useState<{ current: number; pageSize: number }>({ current: 1, pageSize: 20 });
  // Drawer edit form (separate from modal form)
  const [drawerForm] = Form.useForm();
  const [drawerFormDirty, setDrawerFormDirty] = useState(false);
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [drawerPhotoPreview, setDrawerPhotoPreview] = useState<string>("");
  const [drawerPhotoError, setDrawerPhotoError] = useState(false);
  const [editPositionForm] = Form.useForm();
  const [form] = Form.useForm();
  const [positionForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // Derived drawer state
  const detailCandidate = selectedIndex !== null ? displayedCandidates[selectedIndex] ?? null : null;
  const hasNext = selectedIndex !== null && selectedIndex < displayedCandidates.length - 1;
  const hasPrevious = selectedIndex !== null && selectedIndex > 0;
  const isMobile = useIsMobile();

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    const [candidatesRes, assignmentsRes] = await Promise.all([
      supabase.from("candidates").select("*, state:states!candidates_state_id_fkey(abbr), body:government_bodies(name, member_title)").order("last_name"),
      supabase.from("race_candidates").select(`
        candidate_id, race_id,
        race:races!inner(
          rating,
          district:districts!inner(
            state:states!inner(abbr),
            body:government_bodies!inner(name)
          )
        )
      `),
    ]);

    // Build a map of candidate_id → first race info
    const raceMap = new Map<number, { race_id: number; label: string }>();
    for (const rc of (assignmentsRes.data ?? []) as any[]) {
      if (!raceMap.has(rc.candidate_id)) {
        const abbr = rc.race?.district?.state?.abbr ?? "??";
        const body = rc.race?.district?.body?.name ?? "";
        raceMap.set(rc.candidate_id, {
          race_id: rc.race_id,
          label: `${abbr} — ${body}`,
        });
      }
    }

    const rows = ((candidatesRes.data ?? []) as any[]).map((c) => {
      const assignment = raceMap.get(c.id);
      return {
        ...c,
        state_abbr: c.state?.abbr ?? null,
        body_name: c.body?.name ?? null,
        body_member_title: c.body?.member_title ?? null,
        race_id: assignment?.race_id ?? null,
        race_label: assignment?.label ?? null,
      } as CandidateRow;
    });

    setCandidates(rows);
    setLoading(false);
  }, []);

  const loadTopics = useCallback(async () => {
    const { data } = await supabase.from("topics").select("id, name").order("name");
    setTopics(data ?? []);
  }, []);

  const loadRaces = useCallback(async () => {
    setRacesLoading(true);
    const { data } = await supabase
      .from("races")
      .select(`
        id, rating,
        cycle:election_cycles!inner(name),
        district:districts!inner(
          name,
          state:states!inner(name, abbr),
          body:government_bodies!inner(name)
        )
      `)
      .order("id", { ascending: false });
    setAllRaces(
      (data ?? []).map((r: any) => ({
        id: r.id,
        cycle_name: r.cycle?.name ?? "",
        state_abbr: r.district?.state?.abbr ?? "",
        state_name: r.district?.state?.name ?? "",
        body_name: r.district?.body?.name ?? "",
        district_name: r.district?.name ?? "",
        rating: r.rating,
      }))
    );
    setRacesLoading(false);
  }, []);

  const loadBodies = useCallback(async () => {
    const { data } = await supabase
      .from("government_bodies")
      .select("id, name, member_title")
      .order("id");
    setBodyOptions(
      (data ?? []).map((b: any) => ({
        value: b.id,
        label: b.member_title ?? b.name,
      }))
    );
  }, []);

  useEffect(() => {
    loadCandidates();
    loadTopics();
    loadRaces();
    loadBodies();
  }, [loadCandidates, loadTopics, loadRaces, loadBodies]);

  useEffect(() => {
    setHeaderActions(
      <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
        Candidate
      </Button>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  // Sync displayedCandidates when candidates reload
  useEffect(() => {
    setDisplayedCandidates(candidates);
  }, [candidates]);

  // Re-find selectedIndex by ID when displayedCandidates changes (e.g. after save + reload)
  useEffect(() => {
    if (detailCandidateId !== null) {
      const idx = displayedCandidates.findIndex((c) => c.id === detailCandidateId);
      if (idx >= 0) {
        setSelectedIndex(idx);
      } else {
        // Candidate was deleted or filtered out
        setSelectedIndex(null);
        setDetailCandidateId(null);
      }
    }
  }, [displayedCandidates, detailCandidateId]);

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
      body_id: record.body_id ?? undefined,
      is_incumbent: record.is_incumbent,
      is_retiring: record.is_retiring ?? false,
      term_start_year: record.term_start_year ?? undefined,
      bioguide_id: record.bioguide_id ?? "",
      fec_candidate_id: record.fec_candidate_id ?? "",
      govtrack_url: record.govtrack_url ?? "",
      race_id: record.race_id ?? undefined,
    });
    setPhotoPreview(record.photo_url ?? "");
    setPhotoError(false);
    setModalOpen(true);
  }

  function populateDrawerForm(record: CandidateRow) {
    drawerForm.setFieldsValue({
      first_name: record.first_name,
      last_name: record.last_name,
      slug: record.slug,
      party: record.party,
      photo_url: record.photo_url ?? "",
      website: record.website ?? "",
      twitter: record.twitter ?? "",
      bio: record.bio ?? "",
      body_id: record.body_id ?? undefined,
      is_incumbent: record.is_incumbent,
      is_retiring: record.is_retiring ?? false,
      term_start_year: record.term_start_year ?? undefined,
      bioguide_id: record.bioguide_id ?? "",
      fec_candidate_id: record.fec_candidate_id ?? "",
      govtrack_url: record.govtrack_url ?? "",
      race_id: record.race_id ?? undefined,
    });
    setDrawerPhotoPreview(record.photo_url ?? "");
    setDrawerPhotoError(false);
    setDrawerFormDirty(false);
  }

  function openDetailDrawer(record: CandidateRow) {
    const idx = displayedCandidates.findIndex((c) => c.id === record.id);
    setSelectedIndex(idx >= 0 ? idx : null);
    setDetailCandidateId(record.id);
    loadCandidateDetails(record.id);
    populateDrawerForm(record);
  }

  function closeDetailDrawer() {
    if (drawerFormDirty) {
      Modal.confirm({
        title: "Unsaved changes",
        content: "You have unsaved changes. Discard them?",
        okText: "Discard",
        cancelText: "Go back",
        onOk: () => {
          setSelectedIndex(null);
          setDetailCandidateId(null);
          setEditingPositionId(null);
          setDrawerFormDirty(false);
        },
      });
    } else {
      setSelectedIndex(null);
      setDetailCandidateId(null);
      setEditingPositionId(null);
    }
  }

  function handleNavigate(direction: "next" | "previous") {
    if (selectedIndex === null) return;
    const newIndex = direction === "next" ? selectedIndex + 1 : selectedIndex - 1;
    if (newIndex < 0 || newIndex >= displayedCandidates.length) return;

    const proceed = () => {
      const newCandidate = displayedCandidates[newIndex];
      setSelectedIndex(newIndex);
      setDetailCandidateId(newCandidate.id);
      loadCandidateDetails(newCandidate.id);
      populateDrawerForm(newCandidate);
      setEditingPositionId(null);
    };

    if (drawerFormDirty) {
      Modal.confirm({
        title: "Unsaved changes",
        content: "You have unsaved changes. Discard them?",
        okText: "Discard",
        cancelText: "Go back",
        onOk: proceed,
      });
    } else {
      proceed();
    }
  }

  function buildCandidatePayload(values: any) {
    return {
      first_name: values.first_name,
      last_name: values.last_name,
      slug: values.slug,
      party: values.party,
      photo_url: values.photo_url || null,
      website: values.website || null,
      twitter: values.twitter || null,
      bio: values.bio || null,
      body_id: values.body_id || null,
      is_incumbent: values.is_incumbent ?? false,
      is_retiring: values.is_retiring ?? false,
      term_start_year: values.term_start_year || null,
      bioguide_id: values.bioguide_id || null,
      fec_candidate_id: values.fec_candidate_id || null,
      govtrack_url: values.govtrack_url || null,
    };
  }

  async function handleDrawerSave() {
    try {
      const values = await drawerForm.validateFields();
      if (!detailCandidate) return;
      setDrawerSaving(true);

      const raceId = values.race_id || null;
      const payload = buildCandidatePayload(values);

      const { error } = await supabase
        .from("candidates")
        .update(payload)
        .eq("id", detailCandidate.id);

      if (error) {
        messageApi.error(error.message);
      } else {
        if (raceId) {
          await supabase
            .from("race_candidates")
            .upsert(
              { race_id: raceId, candidate_id: detailCandidate.id, status: "announced" as CandidateStatus, is_incumbent: values.is_incumbent ?? false },
              { onConflict: "race_id,candidate_id" }
            );
        }
        messageApi.success("Candidate updated");
        setDrawerFormDirty(false);
        loadCandidates();
      }
    } catch {
      // Validation failed — form shows errors inline
    } finally {
      setDrawerSaving(false);
    }
  }

  async function handleSave(values: any) {
    setModalLoading(true);
    const raceId = values.race_id || null;
    const payload = buildCandidatePayload(values);

    if (editingCandidate) {
      const { error } = await supabase
        .from("candidates")
        .update(payload)
        .eq("id", editingCandidate.id);
      if (error) {
        messageApi.error(error.message);
      } else {
        // Update race assignment if changed
        if (raceId) {
          await supabase
            .from("race_candidates")
            .upsert(
              { race_id: raceId, candidate_id: editingCandidate.id, status: "announced" as CandidateStatus, is_incumbent: values.is_incumbent ?? false },
              { onConflict: "race_id,candidate_id" }
            );
        }
        messageApi.success("Candidate updated");
        setModalOpen(false);
        loadCandidates();
      }
    } else {
      const { data: newCandidate, error } = await supabase
        .from("candidates")
        .insert(payload)
        .select("id")
        .single();
      if (error) {
        messageApi.error(error.message);
      } else {
        // Create race assignment if provided
        if (raceId && newCandidate) {
          await supabase
            .from("race_candidates")
            .upsert(
              { race_id: raceId, candidate_id: newCandidate.id, status: "announced" as CandidateStatus, is_incumbent: values.is_incumbent ?? false },
              { onConflict: "race_id,candidate_id" }
            );
        }
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
      if (detailCandidateId === id) {
        setSelectedIndex(null);
        setDetailCandidateId(null);
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

  async function handleInlineRaceAssign(candidateId: number, raceId: number | null) {
    if (!raceId) return;
    const { error } = await supabase
      .from("race_candidates")
      .upsert(
        { race_id: raceId, candidate_id: candidateId, status: "announced" as CandidateStatus, is_incumbent: false },
        { onConflict: "race_id,candidate_id" }
      );
    if (error) {
      messageApi.error(error.message);
    } else {
      messageApi.success("Race assigned");
      loadCandidates();
    }
  }

  async function handleDrawerAddRace(raceId: number) {
    if (!detailCandidate) return;
    const { error } = await supabase
      .from("race_candidates")
      .upsert(
        { race_id: raceId, candidate_id: detailCandidate.id, status: "announced" as CandidateStatus, is_incumbent: detailCandidate.is_incumbent },
        { onConflict: "race_id,candidate_id" }
      );
    if (error) {
      messageApi.error(error.message);
    } else {
      messageApi.success("Race assigned");
      loadCandidateDetails(detailCandidate.id);
      loadCandidates();
    }
  }

  async function handleDrawerRemoveRace(raceId: number) {
    if (!detailCandidate) return;
    const { error } = await supabase
      .from("race_candidates")
      .delete()
      .eq("race_id", raceId)
      .eq("candidate_id", detailCandidate.id);
    if (error) {
      messageApi.error(error.message);
    } else {
      messageApi.success("Race removed");
      loadCandidateDetails(detailCandidate.id);
      loadCandidates();
    }
  }

  async function handleDrawerUpdateRaceStatus(raceId: number, status: CandidateStatus) {
    if (!detailCandidate) return;
    const { error } = await supabase
      .from("race_candidates")
      .update({ status })
      .eq("race_id", raceId)
      .eq("candidate_id", detailCandidate.id);
    if (error) {
      messageApi.error(error.message);
    } else {
      loadCandidateDetails(detailCandidate.id);
    }
  }

  function openBulkAssign() {
    if (allRaces.length === 0) loadRaces();
    setBulkAssignRaceId(null);
    setBulkAssignStatus("announced");
    setBulkAssignIncumbent(false);
    setBulkAssignOpen(true);
  }

  async function handleBulkAssign() {
    if (!bulkAssignRaceId || selectedRowKeys.length === 0) return;
    setBulkAssignLoading(true);

    const rows = selectedRowKeys.map((candidateId) => ({
      race_id: bulkAssignRaceId,
      candidate_id: candidateId as number,
      status: bulkAssignStatus,
      is_incumbent: bulkAssignIncumbent,
    }));

    const { error } = await supabase
      .from("race_candidates")
      .upsert(rows, { onConflict: "race_id,candidate_id" });

    if (error) {
      messageApi.error(error.message);
    } else {
      messageApi.success(`Assigned ${rows.length} candidate(s) to race`);
      setBulkAssignOpen(false);
      setSelectedRowKeys([]);
    }
    setBulkAssignLoading(false);
  }

  async function handleBulkDelete() {
    const ids = selectedRowKeys as number[];
    Modal.confirm({
      title: `Delete ${ids.length} candidate(s)?`,
      content: "This will also remove their positions and race assignments.",
      okText: "Delete All",
      okType: "danger",
      onOk: async () => {
        const { error } = await supabase
          .from("candidates")
          .delete()
          .in("id", ids);
        if (error) {
          messageApi.error(error.message);
        } else {
          messageApi.success(`Deleted ${ids.length} candidate(s)`);
          setSelectedRowKeys([]);
          loadCandidates();
        }
      },
    });
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


  const raceSelectOptions = allRaces.map((r) => ({
    value: r.id,
    label: `${r.state_abbr} — ${r.body_name}${r.rating ? ` (${r.rating})` : ""} — ${r.cycle_name}`,
  }));

  const partyLetters: Record<string, string> = {
    Democrat: "D",
    Republican: "R",
    Independent: "I",
    Libertarian: "L",
    Green: "G",
    Other: "O",
  };

  /** Build smart-filtered race options for a given candidate */
  function getSmartRaceOptions(record: CandidateRow) {
    if (!record.state_abbr && !record.body_name) return raceSelectOptions;

    // Split into matching and non-matching races
    const matching: typeof raceSelectOptions = [];
    const rest: typeof raceSelectOptions = [];

    for (const opt of raceSelectOptions) {
      const race = allRaces.find((r) => r.id === opt.value);
      if (!race) { rest.push(opt); continue; }

      const stateMatch = !record.state_abbr || race.state_abbr === record.state_abbr;
      const bodyOk = !record.body_name || race.body_name === record.body_name;

      if (stateMatch && bodyOk) matching.push(opt);
      else rest.push(opt);
    }

    if (matching.length === 0) return raceSelectOptions;
    return [
      ...matching,
      ...(rest.length > 0 ? [{ value: -1 as number, label: "── Other races ──", disabled: true }] : []),
      ...rest,
    ];
  }

  const columns = [
    {
      title: "",
      key: "photo",
      width: 40,
      render: (_: unknown, record: CandidateRow) => (
        <Avatar
          size="small"
          src={record.photo_url || undefined}
          style={{ backgroundColor: record.photo_url ? undefined : "#1E293B", fontSize: 11 }}
        >
          {record.first_name[0]}{record.last_name[0]}
        </Avatar>
      ),
    },
    {
      title: "Name",
      key: "name",
      width: 200,
      sorter: (a: CandidateRow, b: CandidateRow) =>
        a.last_name.localeCompare(b.last_name),
      sortOrder: tableSorter?.field === "name" ? tableSorter.order : undefined,
      filters: [
        ...partyOptions.map((p) => ({ text: p.label, value: p.value })),
        { text: "Incumbent", value: "__incumbent__" },
        { text: "Retiring", value: "__retiring__" },
      ],
      filteredValue: tableFilters.name ?? null,
      onFilter: (value: unknown, record: CandidateRow) => {
        if (value === "__incumbent__") return record.is_incumbent;
        if (value === "__retiring__") return record.is_retiring;
        return record.party === value;
      },
      render: (_: unknown, record: CandidateRow) => (
        <span>
          <a onClick={() => openDetailDrawer(record)}>
            {record.first_name} {record.last_name}
          </a>{" "}
          <Tag
            color={partyColors[record.party] ?? "default"}
            style={{ marginLeft: 2, fontSize: 11, lineHeight: "16px", padding: "0 4px" }}
          >
            {partyLetters[record.party] ?? "?"}
          </Tag>
          {record.is_incumbent && (
            <Tag color="green" style={{ fontSize: 10, lineHeight: "16px", padding: "0 3px" }}>Inc</Tag>
          )}
          {record.is_retiring && (
            <Tag color="orange" style={{ fontSize: 10, lineHeight: "16px", padding: "0 3px" }}>Ret</Tag>
          )}
        </span>
      ),
    },
    {
      title: "State",
      key: "state",
      width: 60,
      sorter: (a: CandidateRow, b: CandidateRow) =>
        (a.state_abbr ?? "").localeCompare(b.state_abbr ?? ""),
      sortOrder: tableSorter?.field === "state" ? tableSorter.order : undefined,
      render: (_: unknown, record: CandidateRow) =>
        record.state_abbr ? (
          <Text style={{ fontSize: 12 }}>{record.state_abbr}</Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 11 }}>—</Text>
        ),
    },
    {
      title: "Body",
      dataIndex: "body_member_title",
      key: "body",
      width: 150,
      responsive: ["lg"] as ("lg")[],
      ellipsis: true,
      sorter: (a: CandidateRow, b: CandidateRow) =>
        (a.body_member_title ?? "").localeCompare(b.body_member_title ?? ""),
      sortOrder: tableSorter?.field === "body_member_title" ? tableSorter.order : undefined,
      filters: [
        ...bodyOptions.map((b) => ({ text: b.label, value: b.value })),
        { text: "None", value: "__none__" },
      ],
      filteredValue: tableFilters.body ?? null,
      onFilter: (value: unknown, record: CandidateRow) => {
        if (value === "__none__") return !record.body_id;
        return record.body_id === value;
      },
      render: (_: any, record: CandidateRow) =>
        record.body_member_title || <Text type="secondary">—</Text>,
    },
    {
      title: "Race",
      key: "race",
      width: 200,
      render: (_: unknown, record: CandidateRow) => (
        <Select
          size="small"
          showSearch
          allowClear
          placeholder="Assign race..."
          value={record.race_id ?? undefined}
          loading={racesLoading}
          onChange={(val: number | undefined) => handleInlineRaceAssign(record.id, val ?? null)}
          filterOption={(input, option) =>
            !(option as any)?.disabled &&
            (option?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
          }
          options={getSmartRaceOptions(record)}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "FEC",
      key: "fec",
      width: 50,
      filters: [
        { text: "Linked", value: true },
        { text: "No FEC", value: false },
      ],
      filteredValue: tableFilters.fec ?? null,
      onFilter: (value: unknown, record: CandidateRow) =>
        (!!record.fec_candidate_id) === value,
      render: (_: unknown, record: CandidateRow) =>
        record.fec_candidate_id ? (
          <Tooltip title={record.fec_candidate_id}>
            <Tag color="cyan" style={{ fontSize: 10, padding: "0 3px", lineHeight: "16px" }}>FEC</Tag>
          </Tooltip>
        ) : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
    {
      title: "GT",
      key: "govtrack",
      width: 44,
      filters: [
        { text: "Linked", value: true },
        { text: "No GT", value: false },
      ],
      filteredValue: tableFilters.govtrack ?? null,
      onFilter: (value: unknown, record: CandidateRow) =>
        (!!record.govtrack_url) === value,
      render: (_: unknown, record: CandidateRow) =>
        record.govtrack_url ? (
          <Tooltip title={record.govtrack_url}>
            <Tag color="purple" style={{ fontSize: 10, padding: "0 3px", lineHeight: "16px" }}>GT</Tag>
          </Tooltip>
        ) : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
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

  const mobileCards = isMobile && (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {candidates.map((c) => (
        <Card key={c.id} size="small" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
              {c.photo_url ? (
                <img src={c.photo_url} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#999" }}>
                  {c.first_name[0]}{c.last_name[0]}
                </div>
              )}
              <div>
                <a onClick={() => openDetailDrawer(c)} style={{ fontWeight: 600, fontSize: 14 }}>
                  {c.first_name} {c.last_name}
                </a>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 2 }}>
                  <Tag color={partyColors[c.party] ?? "default"} style={{ margin: 0, fontSize: 10 }}>{c.party}</Tag>
                  {c.is_incumbent && <Tag color="green" style={{ margin: 0, fontSize: 10 }}>Inc</Tag>}
                  {c.is_retiring && <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>Ret</Tag>}
                  {c.state_abbr && <Tag style={{ margin: 0, fontSize: 10 }}>{c.state_abbr}</Tag>}
                </div>
              </div>
            </div>
            <Dropdown
              menu={{
                items: [
                  {
                    key: "edit",
                    icon: <EditOutlined />,
                    label: "Edit",
                    onClick: () => openEditModal(c),
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
                        onOk: () => handleDelete(c.id),
                      });
                    },
                  },
                ],
              }}
              trigger={["click"]}
            >
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </div>
          {c.body_member_title && (
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 2 }}>{c.body_member_title}</Text>
          )}
          {c.race_label && (
            <Text type="secondary" style={{ fontSize: 12 }}>Race: {c.race_label}</Text>
          )}
        </Card>
      ))}
    </div>
  );

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
        Candidates appear on the Senate, Map, and Re-elect or Reject pages when assigned to a race.
        {" "}Select rows to bulk-assign to a race or delete.
      </Text>

      {/* Bulk action toolbar */}
      {selectedRowKeys.length > 0 && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 16px",
            background: "#f0f5ff",
            borderRadius: 8,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: isMobile ? 8 : 12,
            border: "1px solid #d6e4ff",
          }}
        >
          <Text strong style={{ fontSize: 13 }}>
            {selectedRowKeys.length} selected
          </Text>
          <Button
            size="small"
            type="primary"
            icon={<TeamOutlined />}
            onClick={openBulkAssign}
          >
            Assign to Race
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={handleBulkDelete}
          >
            Delete
          </Button>
          <Button
            size="small"
            type="text"
            onClick={() => setSelectedRowKeys([])}
          >
            Clear
          </Button>
        </div>
      )}

      {isMobile ? mobileCards : (
        <Table
          dataSource={candidates}
          columns={columns}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            columnWidth: 40,
          }}
          onChange={(pagination, filters, sorter, extra) => {
            setTableFilters(filters as Record<string, any[] | null>);
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            setTableSorter(s?.order ? { field: s.field as string, order: s.order } : null);
            setTablePagination({ current: pagination.current ?? 1, pageSize: pagination.pageSize ?? 20 });
            setDisplayedCandidates(extra.currentDataSource as CandidateRow[]);
          }}
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
          pagination={{ ...tablePagination, showSizeChanger: true }}
        />
      )}

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
        width={isMobile ? "100vw" : 600}
        style={isMobile ? { top: 0, maxWidth: "100vw", margin: 0, paddingBottom: 0 } : undefined}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16 }}>
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

          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16 }}>
            <Form.Item name="website" label="Website" style={{ flex: 1 }}>
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item name="twitter" label="Twitter / X" style={{ flex: 1 }}>
              <Input placeholder="handle (without @)" />
            </Form.Item>
          </div>

          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16, alignItems: "flex-start" }}>
            <Form.Item name="body_id" label="Government Body" style={{ flex: 1 }}>
              <Select allowClear placeholder="Select body..." options={bodyOptions} />
            </Form.Item>
            <Form.Item name="term_start_year" label="Term Start Year" style={{ flex: 1 }}>
              <Input type="number" placeholder="e.g., 2021" />
            </Form.Item>
          </div>

          <Form.Item name="is_retiring" valuePropName="checked">
            <Checkbox>Retiring / Not seeking re-election</Checkbox>
          </Form.Item>

          <Form.Item name="bio" label="Bio">
            <TextArea rows={3} placeholder="Brief biography..." />
          </Form.Item>

          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16, alignItems: "flex-start" }}>
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
              name="fec_candidate_id"
              label={
                <span>
                  FEC ID{" "}
                  <Tooltip title="OpenFEC candidate ID (e.g., S8CA00502). Auto-populated by FEC Import. Used to sync with FEC data.">
                    <InfoCircleOutlined style={{ color: "#999" }} />
                  </Tooltip>
                </span>
              }
              style={{ flex: 1 }}
            >
              <Input placeholder="e.g., S8CA00502" />
            </Form.Item>
          </div>
          <Form.Item
            name="govtrack_url"
            label={
              <span>
                GovTrack URL{" "}
                <Tooltip title="Link to this candidate's GovTrack.us profile page. Shows voting records, bill sponsorships, and more.">
                  <InfoCircleOutlined style={{ color: "#999" }} />
                </Tooltip>
              </span>
            }
          >
            <Input placeholder="https://www.govtrack.us/congress/members/..." />
          </Form.Item>
          <Form.Item
            name="is_incumbent"
            valuePropName="checked"
            style={{ marginBottom: 16 }}
          >
            <Checkbox>Incumbent</Checkbox>
          </Form.Item>

          <Form.Item
            name="race_id"
            label="Race Assignment"
            tooltip="Races are auto-filtered based on the candidate's state and role when available."
          >
            <Select
              showSearch
              allowClear
              loading={racesLoading}
              placeholder="Assign to a race (optional)..."
              filterOption={(input, option) =>
                !(option as any)?.disabled &&
                (option?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={(() => {
                if (!editingCandidate) return raceSelectOptions;
                return getSmartRaceOptions(editingCandidate);
              })()}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={modalLoading} block>
              {editingCandidate ? "Save Changes" : "Create Candidate"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Assign to Race Modal */}
      <Modal
        title={`Assign ${selectedRowKeys.length} candidate(s) to a race`}
        open={bulkAssignOpen}
        onCancel={() => setBulkAssignOpen(false)}
        okText="Assign"
        okButtonProps={{ disabled: !bulkAssignRaceId, loading: bulkAssignLoading }}
        onOk={handleBulkAssign}
        width={isMobile ? "100vw" : 600}
        style={isMobile ? { top: 0, maxWidth: "100vw", margin: 0, paddingBottom: 0 } : undefined}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            This will link the selected candidates to the chosen race in the race_candidates table.
            Existing assignments to the same race will be updated (upsert).
          </Text>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Race</Text>
          <Select
            showSearch
            loading={racesLoading}
            placeholder="Search by state or body..."
            value={bulkAssignRaceId}
            onChange={setBulkAssignRaceId}
            style={{ width: "100%" }}
            filterOption={(input, option) =>
              (option?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={allRaces.map((r) => ({
              value: r.id,
              label: `${r.state_abbr} — ${r.body_name}${r.rating ? ` (${r.rating})` : ""} — ${r.cycle_name}`,
            }))}
          />
        </div>

        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <Text strong style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Status</Text>
            <Select
              value={bulkAssignStatus}
              onChange={setBulkAssignStatus}
              style={{ width: "100%" }}
              options={[
                { value: "announced", label: "Announced" },
                { value: "primary_winner", label: "Primary Winner" },
                { value: "runoff", label: "Runoff" },
                { value: "withdrawn", label: "Withdrawn" },
                { value: "won", label: "Won" },
                { value: "lost", label: "Lost" },
              ]}
            />
          </div>
          <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "flex-end", paddingBottom: isMobile ? 0 : 4 }}>
            <Checkbox
              checked={bulkAssignIncumbent}
              onChange={(e) => setBulkAssignIncumbent(e.target.checked)}
            >
              Mark as incumbent
            </Checkbox>
          </div>
        </div>

        {bulkAssignRaceId && (
          <Alert
            type="info"
            showIcon
            style={{ fontSize: 13 }}
            message={
              <>
                Assigning: {selectedRowKeys.length} candidate(s) as{" "}
                <Tag>{bulkAssignStatus}</Tag>
                {bulkAssignIncumbent && <Tag color="green">incumbent</Tag>}
              </>
            }
          />
        )}
      </Modal>

      {/* Detail Drawer */}
      {/* Detail Drawer with edit form + prev/next navigation */}
      <ResizableDrawer
        title={
          detailCandidate
            ? `${detailCandidate.first_name} ${detailCandidate.last_name}`
            : "Candidate Details"
        }
        open={selectedIndex !== null}
        onClose={closeDetailDrawer}
        extra={
          <Space.Compact>
            <Button
              size="small"
              icon={<LeftOutlined />}
              onClick={() => handleNavigate("previous")}
              disabled={!hasPrevious}
              title="Previous candidate"
            />
            <Button
              size="small"
              icon={<RightOutlined />}
              onClick={() => handleNavigate("next")}
              disabled={!hasNext}
              title="Next candidate"
            />
          </Space.Compact>
        }
        defaultWidth={560}
        minWidth={400}
        maxWidth={900}
        storageKey="candidate-detail"
        drawerProps={{ styles: { body: { overflowX: "hidden" } } }}
      >
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
                {detailCandidate.body_member_title && (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {detailCandidate.body_member_title}
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

            <Tabs
              items={[
                {
                  key: "details",
                  label: (
                    <span>
                      Details
                      {drawerFormDirty && <span style={{ color: "#faad14", marginLeft: 4 }}>*</span>}
                    </span>
                  ),
                  children: (
                    <Form
                      form={drawerForm}
                      layout="vertical"
                      size="small"
                      onValuesChange={() => setDrawerFormDirty(true)}
                      onFinish={handleDrawerSave}
                    >
                      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12 }}>
                        <Form.Item
                          name="first_name"
                          label="First Name"
                          rules={[{ required: true, message: "Required" }]}
                          style={{ flex: 1 }}
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          name="last_name"
                          label="Last Name"
                          rules={[{ required: true, message: "Required" }]}
                          style={{ flex: 1 }}
                        >
                          <Input />
                        </Form.Item>
                      </div>

                      <Form.Item
                        name="slug"
                        label={
                          <span>
                            Slug{" "}
                            <Tooltip title="Used in URLs to identify this candidate.">
                              <InfoCircleOutlined style={{ color: "#999" }} />
                            </Tooltip>
                          </span>
                        }
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <Input disabled />
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
                            setDrawerPhotoPreview(e.target.value);
                            setDrawerPhotoError(false);
                          }}
                        />
                      </Form.Item>
                      {drawerPhotoPreview && (
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
                          {!drawerPhotoError ? (
                            <img
                              src={drawerPhotoPreview}
                              alt="Preview"
                              style={{ maxWidth: 120, maxHeight: 160, borderRadius: 4 }}
                              onError={() => setDrawerPhotoError(true)}
                            />
                          ) : (
                            <Text type="secondary">Image failed to load</Text>
                          )}
                        </div>
                      )}

                      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12 }}>
                        <Form.Item name="website" label="Website" style={{ flex: 1 }}>
                          <Input placeholder="https://..." />
                        </Form.Item>
                        <Form.Item name="twitter" label="Twitter / X" style={{ flex: 1 }}>
                          <Input placeholder="handle (without @)" />
                        </Form.Item>
                      </div>

                      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, alignItems: "flex-start" }}>
                        <Form.Item name="body_id" label="Government Body" style={{ flex: 1 }}>
                          <Select allowClear placeholder="Select body..." options={bodyOptions} />
                        </Form.Item>
                        <Form.Item name="term_start_year" label="Term Start Year" style={{ flex: 1 }}>
                          <Input type="number" placeholder="e.g., 2021" />
                        </Form.Item>
                      </div>

                      <Form.Item name="is_retiring" valuePropName="checked">
                        <Checkbox>Retiring / Not seeking re-election</Checkbox>
                      </Form.Item>

                      <Form.Item name="bio" label="Bio">
                        <TextArea rows={3} placeholder="Brief biography..." />
                      </Form.Item>

                      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, alignItems: "flex-start" }}>
                        <Form.Item
                          name="bioguide_id"
                          label={
                            <span>
                              Bioguide ID{" "}
                              <Tooltip title="Congressional Biographical Directory ID (e.g., C001035).">
                                <InfoCircleOutlined style={{ color: "#999" }} />
                              </Tooltip>
                            </span>
                          }
                          style={{ flex: 1 }}
                        >
                          <Input placeholder="e.g., C001035" />
                        </Form.Item>
                        <Form.Item
                          name="fec_candidate_id"
                          label={
                            <span>
                              FEC ID{" "}
                              <Tooltip title="OpenFEC candidate ID (e.g., S8CA00502).">
                                <InfoCircleOutlined style={{ color: "#999" }} />
                              </Tooltip>
                            </span>
                          }
                          style={{ flex: 1 }}
                        >
                          <Input placeholder="e.g., S8CA00502" />
                        </Form.Item>
                      </div>

                      <Form.Item
                        name="govtrack_url"
                        label={
                          <span>
                            GovTrack URL{" "}
                            <Tooltip title="Link to GovTrack.us profile. Shows voting records, bill sponsorships, and more.">
                              <InfoCircleOutlined style={{ color: "#999" }} />
                            </Tooltip>
                          </span>
                        }
                      >
                        <Input placeholder="https://www.govtrack.us/congress/members/..." />
                      </Form.Item>

                      <Form.Item name="is_incumbent" valuePropName="checked" style={{ marginBottom: 12 }}>
                        <Checkbox>Incumbent</Checkbox>
                      </Form.Item>

                      <Form.Item
                        name="race_id"
                        label="Race Assignment"
                        tooltip="Races are auto-filtered based on the candidate's state and role."
                      >
                        <Select
                          showSearch
                          allowClear
                          loading={racesLoading}
                          placeholder="Assign to a race (optional)..."
                          filterOption={(input, option) =>
                            !(option as any)?.disabled &&
                            ((option?.label as string) ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                          options={detailCandidate ? getSmartRaceOptions(detailCandidate) : raceSelectOptions}
                        />
                      </Form.Item>

                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        loading={drawerSaving}
                        block
                      >
                        Save Changes
                      </Button>
                    </Form>
                  ),
                },
                {
                  key: "positions",
                  label: `Positions (${positions.length})`,
                  children: drawerLoading ? (
                    <Spin />
                  ) : (
                    <div>
                      <Text type="secondary" style={{ display: "block", marginBottom: 12, fontSize: 12 }}>
                        Positions appear on the Re-elect or Reject page and candidate profiles.
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
                          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
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
                              style={{ width: isMobile ? "100%" : 110, marginBottom: 8 }}
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
                          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8, alignItems: "flex-start" }}>
                            <Form.Item name="source_url" style={{ flex: 1, marginBottom: isMobile ? 8 : 0, width: isMobile ? "100%" : undefined }}>
                              <Input placeholder="Source URL (optional)" />
                            </Form.Item>
                            <Button
                              type="primary"
                              htmlType="submit"
                              icon={<PlusOutlined />}
                              block={isMobile}
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
                  label: `Races (${races.length})`,
                  children: drawerLoading ? (
                    <Spin />
                  ) : (
                    <div>
                      {/* Add race form */}
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
                          Assign to Race
                        </Text>
                        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
                          <Select
                            showSearch
                            size="small"
                            placeholder="Search by state or body..."
                            loading={racesLoading}
                            filterOption={(input, option) =>
                              (option?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
                            }
                            options={raceSelectOptions.filter(
                              (r) => !races.some((existing) => existing.race_id === r.value)
                            )}
                            style={{ flex: 1, width: isMobile ? "100%" : undefined }}
                            onSelect={(raceId: number) => handleDrawerAddRace(raceId)}
                          />
                        </div>
                      </div>

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
                              title: "Race",
                              key: "race",
                              render: (_: unknown, r: CandidateRaceInfo) =>
                                `${r.state_abbr} — ${r.body_name}`,
                            },
                            {
                              title: "Rating",
                              dataIndex: "rating",
                              key: "rating",
                              width: 90,
                              render: (rating: string | null) =>
                                rating ? <Tag>{rating}</Tag> : <Text type="secondary">—</Text>,
                            },
                            {
                              title: "Status",
                              dataIndex: "status",
                              key: "status",
                              width: 140,
                              render: (s: string, r: CandidateRaceInfo) => (
                                <Select
                                  size="small"
                                  value={s}
                                  onChange={(val) => handleDrawerUpdateRaceStatus(r.race_id, val as CandidateStatus)}
                                  style={{ width: 130 }}
                                  options={[
                                    { value: "announced", label: "Announced" },
                                    { value: "primary_winner", label: "Primary Winner" },
                                    { value: "runoff", label: "Runoff" },
                                    { value: "withdrawn", label: "Withdrawn" },
                                    { value: "won", label: "Won" },
                                    { value: "lost", label: "Lost" },
                                  ]}
                                />
                              ),
                            },
                            {
                              title: "",
                              key: "remove",
                              width: 48,
                              render: (_: unknown, r: CandidateRaceInfo) => (
                                <Popconfirm
                                  title="Remove from this race?"
                                  onConfirm={() => handleDrawerRemoveRace(r.race_id)}
                                  okText="Remove"
                                  okType="danger"
                                >
                                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                              ),
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
      </ResizableDrawer>
    </div>
  );
}
