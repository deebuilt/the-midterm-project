import { useState, useCallback, useEffect, type ReactNode } from "react";
import {
  Table,
  Card,
  Select,
  Tag,
  Button,
  Modal,
  Input,
  Typography,
  Space,
  message,
  Tooltip,
  Segmented,
  Alert,
  Spin,
  Progress,
  Statistic,
  Row,
  Col,
  Checkbox,
  Divider,
  Badge,
  Dropdown,
} from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  SendOutlined,
  ExclamationCircleOutlined,
  ApiOutlined,
  CloudDownloadOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  MoreOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { supabase } from "../../lib/supabase";
import {
  OpenFecClient,
  parseFecName,
  mapFecParty,
  slugifyName,
  type FecCandidate,
} from "../../lib/openfec";
import { useIsMobile } from "./useIsMobile";

const { Text } = Typography;
const { TextArea } = Input;

interface FecPageProps {
  setHeaderActions: (actions: ReactNode) => void;
}

// ─── Shared types ───

interface DbFecFiling {
  id: number;
  fec_candidate_id: string;
  cycle_id: number;
  state_id: number;
  name: string;
  first_name: string;
  last_name: string;
  party: string;
  office: "S" | "H";
  district_number: number | null;
  is_incumbent: boolean;
  funds_raised: number;
  funds_spent: number;
  cash_on_hand: number;
  promoted_to_candidate_id: number | null;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
  state?: { name: string; abbr: string };
}

interface PromoteFormData {
  photoUrl: string;
  website: string;
  twitter: string;
  bio: string;
  roleTitle: string;
  raceStatus: "announced" | "primary_winner" | "runoff";
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

const US_STATES = [
  { value: 1, label: "Alabama", abbr: "AL" },
  { value: 2, label: "Alaska", abbr: "AK" },
  { value: 3, label: "Arizona", abbr: "AZ" },
  { value: 4, label: "Arkansas", abbr: "AR" },
  { value: 5, label: "California", abbr: "CA" },
  { value: 6, label: "Colorado", abbr: "CO" },
  { value: 7, label: "Connecticut", abbr: "CT" },
  { value: 8, label: "Delaware", abbr: "DE" },
  { value: 9, label: "Florida", abbr: "FL" },
  { value: 10, label: "Georgia", abbr: "GA" },
  { value: 11, label: "Hawaii", abbr: "HI" },
  { value: 12, label: "Idaho", abbr: "ID" },
  { value: 13, label: "Illinois", abbr: "IL" },
  { value: 14, label: "Indiana", abbr: "IN" },
  { value: 15, label: "Iowa", abbr: "IA" },
  { value: 16, label: "Kansas", abbr: "KS" },
  { value: 17, label: "Kentucky", abbr: "KY" },
  { value: 18, label: "Louisiana", abbr: "LA" },
  { value: 19, label: "Maine", abbr: "ME" },
  { value: 20, label: "Maryland", abbr: "MD" },
  { value: 21, label: "Massachusetts", abbr: "MA" },
  { value: 22, label: "Michigan", abbr: "MI" },
  { value: 23, label: "Minnesota", abbr: "MN" },
  { value: 24, label: "Mississippi", abbr: "MS" },
  { value: 25, label: "Missouri", abbr: "MO" },
  { value: 26, label: "Montana", abbr: "MT" },
  { value: 27, label: "Nebraska", abbr: "NE" },
  { value: 28, label: "Nevada", abbr: "NV" },
  { value: 29, label: "New Hampshire", abbr: "NH" },
  { value: 30, label: "New Jersey", abbr: "NJ" },
  { value: 31, label: "New Mexico", abbr: "NM" },
  { value: 32, label: "New York", abbr: "NY" },
  { value: 33, label: "North Carolina", abbr: "NC" },
  { value: 34, label: "North Dakota", abbr: "ND" },
  { value: 35, label: "Ohio", abbr: "OH" },
  { value: 36, label: "Oklahoma", abbr: "OK" },
  { value: 37, label: "Oregon", abbr: "OR" },
  { value: 38, label: "Pennsylvania", abbr: "PA" },
  { value: 39, label: "Rhode Island", abbr: "RI" },
  { value: 40, label: "South Carolina", abbr: "SC" },
  { value: 41, label: "South Dakota", abbr: "SD" },
  { value: 42, label: "Tennessee", abbr: "TN" },
  { value: 43, label: "Texas", abbr: "TX" },
  { value: 44, label: "Utah", abbr: "UT" },
  { value: 45, label: "Vermont", abbr: "VT" },
  { value: 46, label: "Virginia", abbr: "VA" },
  { value: 47, label: "Washington", abbr: "WA" },
  { value: 48, label: "West Virginia", abbr: "WV" },
  { value: 49, label: "Wisconsin", abbr: "WI" },
  { value: 50, label: "Wyoming", abbr: "WY" },
];

const STORAGE_KEY = "tmp-fec-api-key";

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// ═══════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════

export default function FecPage({ setHeaderActions }: FecPageProps) {
  const [tab, setTab] = useState<"filings" | "sync">("filings");
  const [messageApi, contextHolder] = message.useMessage();
  const isMobile = useIsMobile();

  useEffect(() => {
    setHeaderActions(null);
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  return (
    <div>
      {contextHolder}
      <Segmented
        value={tab}
        onChange={(val) => setTab(val as "filings" | "sync")}
        options={[
          { value: "filings", label: "Filed Candidates" },
          { value: "sync", label: "Sync from FEC" },
        ]}
        style={{ marginBottom: 16 }}
      />

      {tab === "filings" ? (
        <FilingsTab messageApi={messageApi} isMobile={isMobile} />
      ) : (
        <SyncTab
          messageApi={messageApi}
          onSyncComplete={() => setTab("filings")}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Filings Tab
// ═══════════════════════════════════════════

function FilingsTab({ messageApi, isMobile }: { messageApi: ReturnType<typeof message.useMessage>[0]; isMobile: boolean }) {
  const [filings, setFilings] = useState<DbFecFiling[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCycleId, setActiveCycleId] = useState<number | null>(null);

  const [stateFilter, setStateFilter] = useState<number | null>(null);
  const [bodyFilter, setBodyFilter] = useState<string>("all");
  const [partyFilter, setPartyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [promoteModalVisible, setPromoteModalVisible] = useState(false);
  const [selectedFiling, setSelectedFiling] = useState<DbFecFiling | null>(null);
  const [promoteForm, setPromoteForm] = useState<PromoteFormData>({
    photoUrl: "",
    website: "",
    twitter: "",
    bio: "",
    roleTitle: "",
    raceStatus: "announced",
  });
  const [promoting, setPromoting] = useState(false);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkPromoteOpen, setBulkPromoteOpen] = useState(false);
  const [bulkPromoting, setBulkPromoting] = useState(false);

  useEffect(() => {
    fetchActiveCycle();
  }, []);

  useEffect(() => {
    if (activeCycleId !== null) fetchFilings();
  }, [activeCycleId]);

  const fetchActiveCycle = async () => {
    try {
      const { data, error } = await supabase
        .from("election_cycles")
        .select("id")
        .eq("is_active", true)
        .single();
      if (error) throw error;
      setActiveCycleId(data.id);
    } catch (err) {
      console.error("Error fetching active cycle:", err);
      messageApi.error("Failed to fetch active cycle");
    }
  };

  const fetchFilings = async () => {
    if (!activeCycleId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("fec_filings")
        .select("*, state:states!inner(name, abbr)")
        .eq("cycle_id", activeCycleId)
        .order("funds_raised", { ascending: false });
      if (error) throw error;
      setFilings((data as any) || []);
    } catch (err) {
      console.error("Error fetching filings:", err);
      messageApi.error("Failed to fetch filings");
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteClick = (filing: DbFecFiling) => {
    setSelectedFiling(filing);
    setPromoteForm({
      photoUrl: "",
      website: "",
      twitter: "",
      bio: "",
      roleTitle: filing.office === "S" ? "U.S. Senator" : "U.S. Representative",
      raceStatus: "announced",
    });
    setPromoteModalVisible(true);
  };

  const handlePromote = async () => {
    if (!selectedFiling || !activeCycleId) return;
    setPromoting(true);
    try {
      let slug = slugifyName(selectedFiling.first_name, selectedFiling.last_name);
      const { data: existingCandidate } = await supabase
        .from("candidates")
        .select("id")
        .eq("slug", slug)
        .single();
      if (existingCandidate) {
        slug = `${slug}-${(selectedFiling.state?.abbr || "").toLowerCase()}`;
      }

      const { data: newCandidate, error: candidateError } = await supabase
        .from("candidates")
        .insert({
          slug,
          first_name: selectedFiling.first_name,
          last_name: selectedFiling.last_name,
          party: selectedFiling.party,
          role_title: promoteForm.roleTitle,
          state_id: selectedFiling.state_id,
          photo_url: promoteForm.photoUrl || null,
          website: promoteForm.website || null,
          twitter_handle: promoteForm.twitter || null,
          bio: promoteForm.bio || null,
          fec_candidate_id: selectedFiling.fec_candidate_id,
          funds_raised: selectedFiling.funds_raised,
          funds_spent: selectedFiling.funds_spent,
          cash_on_hand: selectedFiling.cash_on_hand,
          fec_financials_updated_at: selectedFiling.last_synced_at,
        })
        .select()
        .single();
      if (candidateError) throw candidateError;

      let districtId: number | null = null;
      if (selectedFiling.office === "S") {
        const { data: senateDistrict } = await supabase
          .from("districts")
          .select("id")
          .eq("state_id", selectedFiling.state_id)
          .eq("body", "senate")
          .single();
        if (senateDistrict) districtId = senateDistrict.id;
      } else {
        const { data: houseDistrict } = await supabase
          .from("districts")
          .select("id")
          .eq("state_id", selectedFiling.state_id)
          .eq("body", "house")
          .eq("district_number", selectedFiling.district_number)
          .single();
        if (houseDistrict) districtId = houseDistrict.id;
      }

      if (!districtId) {
        const { data: newDistrict, error: districtError } = await supabase
          .from("districts")
          .insert({
            state_id: selectedFiling.state_id,
            body: selectedFiling.office === "S" ? "senate" : "house",
            district_number: selectedFiling.district_number,
          })
          .select()
          .single();
        if (districtError) throw districtError;
        districtId = newDistrict.id;
      }

      let raceId: number | null = null;
      const { data: existingRace } = await supabase
        .from("races")
        .select("id")
        .eq("district_id", districtId)
        .eq("cycle_id", activeCycleId)
        .single();

      if (existingRace) {
        raceId = existingRace.id;
      } else {
        const { data: newRace, error: raceError } = await supabase
          .from("races")
          .insert({ district_id: districtId, cycle_id: activeCycleId, rating: null })
          .select()
          .single();
        if (raceError) throw raceError;
        raceId = newRace.id;
      }

      const { error: raceCandidateError } = await supabase
        .from("race_candidates")
        .insert({
          race_id: raceId,
          candidate_id: newCandidate.id,
          status: promoteForm.raceStatus,
          is_incumbent: selectedFiling.is_incumbent,
        });
      if (raceCandidateError) throw raceCandidateError;

      const { error: updateError } = await supabase
        .from("fec_filings")
        .update({ promoted_to_candidate_id: newCandidate.id })
        .eq("id", selectedFiling.id);
      if (updateError) throw updateError;

      messageApi.success(`Promoted ${selectedFiling.first_name} ${selectedFiling.last_name} to candidate`);
      setPromoteModalVisible(false);
      fetchFilings();
    } catch (err) {
      console.error("Error promoting filing:", err);
      messageApi.error("Failed to promote filing");
    } finally {
      setPromoting(false);
    }
  };

  const handleDelete = (filing: DbFecFiling) => {
    Modal.confirm({
      title: "Delete Filing",
      icon: <ExclamationCircleOutlined />,
      content: `Delete the filing for ${filing.first_name} ${filing.last_name}? This cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const { error } = await supabase.from("fec_filings").delete().eq("id", filing.id);
          if (error) throw error;
          messageApi.success("Filing deleted");
          fetchFilings();
        } catch (err) {
          console.error("Error deleting filing:", err);
          messageApi.error("Failed to delete filing");
        }
      },
    });
  };

  const handleBulkPromote = async () => {
    if (selectedRowKeys.length === 0) return;
    setBulkPromoting(true);

    const selectedFilings = filings.filter((f) => selectedRowKeys.includes(f.id));
    let successCount = 0;
    const errors: string[] = [];

    for (const filing of selectedFilings) {
      if (filing.promoted_to_candidate_id) {
        errors.push(`${filing.first_name} ${filing.last_name} already promoted`);
        continue;
      }

      try {
        let slug = slugifyName(filing.first_name, filing.last_name);
        const { data: existingCandidate } = await supabase
          .from("candidates")
          .select("id")
          .eq("slug", slug)
          .single();
        if (existingCandidate) {
          slug = `${slug}-${(filing.state?.abbr || "").toLowerCase()}`;
        }

        const { data: newCandidate, error: candidateError } = await supabase
          .from("candidates")
          .insert({
            slug,
            first_name: filing.first_name,
            last_name: filing.last_name,
            party: filing.party,
            role_title: filing.office === "S" ? "U.S. Senator" : "U.S. Representative",
            state_id: filing.state_id,
            photo_url: null,
            website: null,
            twitter_handle: null,
            bio: null,
            fec_candidate_id: filing.fec_candidate_id,
            funds_raised: filing.funds_raised,
            funds_spent: filing.funds_spent,
            cash_on_hand: filing.cash_on_hand,
            fec_financials_updated_at: filing.last_synced_at,
          })
          .select()
          .single();
        if (candidateError) throw candidateError;

        let districtId: number | null = null;
        if (filing.office === "S") {
          const { data: senateDistrict } = await supabase
            .from("districts")
            .select("id")
            .eq("state_id", filing.state_id)
            .eq("body", "senate")
            .single();
          if (senateDistrict) districtId = senateDistrict.id;
        } else {
          const { data: houseDistrict } = await supabase
            .from("districts")
            .select("id")
            .eq("state_id", filing.state_id)
            .eq("body", "house")
            .eq("district_number", filing.district_number)
            .single();
          if (houseDistrict) districtId = houseDistrict.id;
        }

        if (!districtId) {
          const { data: newDistrict, error: districtError } = await supabase
            .from("districts")
            .insert({
              state_id: filing.state_id,
              body: filing.office === "S" ? "senate" : "house",
              district_number: filing.district_number,
            })
            .select()
            .single();
          if (districtError) throw districtError;
          districtId = newDistrict.id;
        }

        let raceId: number | null = null;
        const { data: existingRace } = await supabase
          .from("races")
          .select("id")
          .eq("district_id", districtId)
          .eq("cycle_id", activeCycleId)
          .single();

        if (existingRace) {
          raceId = existingRace.id;
        } else {
          const { data: newRace, error: raceError } = await supabase
            .from("races")
            .insert({ district_id: districtId, cycle_id: activeCycleId, rating: null })
            .select()
            .single();
          if (raceError) throw raceError;
          raceId = newRace.id;
        }

        const { error: raceCandidateError } = await supabase
          .from("race_candidates")
          .insert({
            race_id: raceId,
            candidate_id: newCandidate.id,
            status: "announced",
            is_incumbent: filing.is_incumbent,
          });
        if (raceCandidateError) throw raceCandidateError;

        const { error: updateError } = await supabase
          .from("fec_filings")
          .update({ promoted_to_candidate_id: newCandidate.id })
          .eq("id", filing.id);
        if (updateError) throw updateError;

        successCount++;
      } catch (err: any) {
        errors.push(`${filing.first_name} ${filing.last_name}: ${err.message}`);
      }
    }

    setBulkPromoting(false);
    setBulkPromoteOpen(false);
    setSelectedRowKeys([]);

    if (successCount > 0) {
      messageApi.success(`Promoted ${successCount} candidate${successCount !== 1 ? "s" : ""}`);
    }
    if (errors.length > 0) {
      Modal.error({
        title: "Some promotions failed",
        content: (
          <ul style={{ paddingLeft: 20, maxHeight: 300, overflow: "auto" }}>
            {errors.map((e, i) => <li key={i} style={{ fontSize: 12 }}>{e}</li>)}
          </ul>
        ),
      });
    }

    fetchFilings();
  };

  const handleBulkDelete = () => {
    const ids = selectedRowKeys as number[];
    Modal.confirm({
      title: `Delete ${ids.length} filing${ids.length !== 1 ? "s" : ""}?`,
      content: "This cannot be undone.",
      okText: "Delete All",
      okType: "danger",
      onOk: async () => {
        const { error } = await supabase
          .from("fec_filings")
          .delete()
          .in("id", ids);
        if (error) {
          messageApi.error(error.message);
        } else {
          messageApi.success(`Deleted ${ids.length} filing${ids.length !== 1 ? "s" : ""}`);
          setSelectedRowKeys([]);
          fetchFilings();
        }
      },
    });
  };

  const filteredFilings = filings.filter((f) => {
    if (stateFilter !== null && f.state_id !== stateFilter) return false;
    if (bodyFilter !== "all") {
      if (bodyFilter === "senate" && f.office !== "S") return false;
      if (bodyFilter === "house" && f.office !== "H") return false;
    }
    if (partyFilter !== "all" && f.party !== partyFilter) return false;
    if (statusFilter === "promoted" && !f.promoted_to_candidate_id) return false;
    if (statusFilter === "not_promoted" && f.promoted_to_candidate_id) return false;
    return true;
  });

  const columns = [
    {
      title: "State",
      dataIndex: ["state", "abbr"],
      key: "state",
      width: 70,
      sorter: (a: DbFecFiling, b: DbFecFiling) =>
        (a.state?.abbr || "").localeCompare(b.state?.abbr || ""),
    },
    {
      title: "Name",
      key: "name",
      width: 200,
      sorter: (a: DbFecFiling, b: DbFecFiling) => a.last_name.localeCompare(b.last_name),
      render: (_: any, record: DbFecFiling) => {
        let partyIndicator = "";
        let partyColor = "gray";
        if (record.party === "Democrat") {
          partyIndicator = "D";
          partyColor = "blue";
        } else if (record.party === "Republican") {
          partyIndicator = "R";
          partyColor = "red";
        } else if (record.party === "Independent") {
          partyIndicator = "I";
          partyColor = "purple";
        }

        return (
          <span>
            {partyIndicator && (
              <Tag color={partyColor} style={{ marginRight: 4, fontSize: 10, fontWeight: "bold" }}>
                {partyIndicator}
              </Tag>
            )}
            <Text strong>{record.first_name} {record.last_name}</Text>
            {record.is_incumbent && (
              <Tag color="green" style={{ marginLeft: 6, fontSize: 10 }}>Inc</Tag>
            )}
          </span>
        );
      },
    },
    {
      title: "FEC ID",
      dataIndex: "fec_candidate_id",
      key: "fec_id",
      width: 110,
      sorter: (a: DbFecFiling, b: DbFecFiling) => a.fec_candidate_id.localeCompare(b.fec_candidate_id),
      render: (fecId: string) => (
        <a
          href={`https://www.fec.gov/data/candidate/${fecId}/`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: "monospace", fontSize: 12 }}
        >
          {fecId}
        </a>
      ),
    },
    {
      title: "Body",
      dataIndex: "office",
      key: "body",
      width: 100,
      sorter: (a: DbFecFiling, b: DbFecFiling) => a.office.localeCompare(b.office),
      render: (office: string) => {
        const color = office === "S" ? "blue" : office === "H" ? "green" : "default";
        const text = office === "S" ? "Senate" : office === "H" ? "House" : office;
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "District",
      key: "district",
      width: 80,
      sorter: (a: DbFecFiling, b: DbFecFiling) =>
        (a.district_number ?? 0) - (b.district_number ?? 0),
      render: (_: any, record: DbFecFiling) => {
        if (record.office === "H" && record.district_number) {
          return `${record.state?.abbr}-${String(record.district_number).padStart(2, "0")}`;
        }
        return "—";
      },
    },
    {
      title: "Raised",
      dataIndex: "funds_raised",
      key: "funds_raised",
      width: 90,
      sorter: (a: DbFecFiling, b: DbFecFiling) => a.funds_raised - b.funds_raised,
      render: (n: number) => <Text style={{ fontFamily: "monospace", fontSize: 12 }}>{formatMoney(n)}</Text>,
    },
    {
      title: "Spent",
      dataIndex: "funds_spent",
      key: "funds_spent",
      width: 90,
      sorter: (a: DbFecFiling, b: DbFecFiling) => a.funds_spent - b.funds_spent,
      render: (n: number) => <Text style={{ fontFamily: "monospace", fontSize: 12 }}>{formatMoney(n)}</Text>,
    },
    {
      title: "Cash",
      dataIndex: "cash_on_hand",
      key: "cash_on_hand",
      width: 90,
      sorter: (a: DbFecFiling, b: DbFecFiling) => a.cash_on_hand - b.cash_on_hand,
      render: (n: number) => <Text style={{ fontFamily: "monospace", fontSize: 12 }}>{formatMoney(n)}</Text>,
    },
    {
      title: "Synced",
      dataIndex: "last_synced_at",
      key: "last_synced_at",
      width: 100,
      sorter: (a: DbFecFiling, b: DbFecFiling) =>
        new Date(a.last_synced_at).getTime() - new Date(b.last_synced_at).getTime(),
      render: (date: string) => <Text type="secondary" style={{ fontSize: 12 }}>{new Date(date).toLocaleDateString()}</Text>,
    },
    {
      title: "Status",
      dataIndex: "promoted_to_candidate_id",
      key: "status",
      width: 100,
      sorter: (a: DbFecFiling, b: DbFecFiling) =>
        Number(!!a.promoted_to_candidate_id) - Number(!!b.promoted_to_candidate_id),
      render: (promotedId: number | null) =>
        promotedId ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>Promoted</Tag>
        ) : (
          <Tag>Staging</Tag>
        ),
    },
    {
      title: "",
      key: "actions",
      width: 48,
      render: (_: any, record: DbFecFiling) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "promote",
                icon: <SendOutlined />,
                label: "Promote",
                disabled: !!record.promoted_to_candidate_id,
                onClick: () => handlePromoteClick(record),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: "Delete",
                danger: true,
                onClick: () => handleDelete(record),
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

  const mobileFilingCards = isMobile && (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {filteredFilings.map((f) => {
        const partyColors: Record<string, string> = { Democrat: "blue", Republican: "red", Independent: "purple" };
        return (
          <Card key={f.id} size="small" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div>
                  <Tag color={partyColors[f.party] ?? "default"} style={{ fontSize: 10, fontWeight: "bold", marginRight: 4 }}>
                    {f.party.charAt(0)}
                  </Tag>
                  <Text strong>{f.first_name} {f.last_name}</Text>
                  {f.is_incumbent && <Tag color="green" style={{ marginLeft: 4, fontSize: 10 }}>Inc</Tag>}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>{f.state?.abbr} · {f.office === "S" ? "Senate" : `House ${f.district_number ?? ""}`}</Text>
              </div>
              <Dropdown
                menu={{
                  items: [
                    { key: "promote", icon: <SendOutlined />, label: "Promote", disabled: !!f.promoted_to_candidate_id, onClick: () => handlePromoteClick(f) },
                    { key: "delete", icon: <DeleteOutlined />, label: "Delete", danger: true, onClick: () => handleDelete(f) },
                  ],
                }}
                trigger={["click"]}
              >
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              <Text style={{ fontFamily: "monospace", fontSize: 12 }}>{formatMoney(f.funds_raised)}</Text>
              {f.promoted_to_candidate_id ? (
                <Tag color="green" icon={<CheckCircleOutlined />} style={{ margin: 0 }}>Promoted</Tag>
              ) : (
                <Tag style={{ margin: 0 }}>Staging</Tag>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          View and manage FEC filings. Promote primary winners to the candidates table.
          {" "}Select rows to bulk-promote or delete.
        </Text>
        <Tag style={{ marginLeft: "auto" }}>{filteredFilings.length} filings</Tag>
      </div>

      {/* Bulk action toolbar */}
      {selectedRowKeys.length > 0 && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 16px",
            background: "#f0f5ff",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 12,
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
            onClick={() => setBulkPromoteOpen(true)}
          >
            Bulk Promote
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

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
        <Select
          placeholder="All states"
          style={{ width: isMobile ? "100%" : 180 }}
          allowClear
          showSearch
          value={stateFilter}
          onChange={setStateFilter}
          filterOption={(input, option) =>
            (option?.label?.toString() || "").toLowerCase().includes(input.toLowerCase())
          }
        >
          {US_STATES.map((state) => (
            <Select.Option key={state.value} value={state.value} label={state.label}>
              {state.abbr} — {state.label}
            </Select.Option>
          ))}
        </Select>

        <Select placeholder="Body" style={{ width: isMobile ? "100%" : 140 }} value={bodyFilter} onChange={setBodyFilter}>
          <Select.Option value="all">All Bodies</Select.Option>
          <Select.Option value="senate">Senate</Select.Option>
          <Select.Option value="house">House</Select.Option>
          <Select.Option value="governor">Governor</Select.Option>
        </Select>

        <Select placeholder="Party" style={{ width: isMobile ? "100%" : 140 }} value={partyFilter} onChange={setPartyFilter}>
          <Select.Option value="all">All Parties</Select.Option>
          <Select.Option value="Democrat">Democrat</Select.Option>
          <Select.Option value="Republican">Republican</Select.Option>
          <Select.Option value="Independent">Independent</Select.Option>
        </Select>

        <Select placeholder="Status" style={{ width: isMobile ? "100%" : 140 }} value={statusFilter} onChange={setStatusFilter}>
          <Select.Option value="all">All Status</Select.Option>
          <Select.Option value="not_promoted">Staging</Select.Option>
          <Select.Option value="promoted">Promoted</Select.Option>
        </Select>
      </div>

      {isMobile ? mobileFilingCards : (
        <Table
          columns={columns}
          dataSource={filteredFilings}
          rowKey="id"
          loading={loading}
          size="small"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            columnWidth: 40,
          }}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showTotal: (total) => `${total} filings`,
          }}
        />
      )}

      <Modal
        title="Promote Filing to Candidate"
        open={promoteModalVisible}
        onCancel={() => setPromoteModalVisible(false)}
        onOk={handlePromote}
        confirmLoading={promoting}
        width={isMobile ? "100vw" : 600}
        style={isMobile ? { top: 0, maxWidth: "100vw", margin: 0, paddingBottom: 0 } : undefined}
        okText="Promote"
      >
        {selectedFiling && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Card size="small" title="Filing Data (Read-only)">
              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                <div><Text strong>Name:</Text> {selectedFiling.first_name} {selectedFiling.last_name}</div>
                <div><Text strong>Party:</Text> {selectedFiling.party}</div>
                <div><Text strong>State:</Text> {selectedFiling.state?.name} ({selectedFiling.state?.abbr})</div>
                <div><Text strong>Office:</Text> {selectedFiling.office === "S" ? "Senate" : `House District ${selectedFiling.district_number}`}</div>
                <div><Text strong>FEC ID:</Text> {selectedFiling.fec_candidate_id}</div>
                <div><Text strong>Raised:</Text> {formatMoney(selectedFiling.funds_raised)} | <Text strong>Spent:</Text> {formatMoney(selectedFiling.funds_spent)} | <Text strong>Cash:</Text> {formatMoney(selectedFiling.cash_on_hand)}</div>
                <div><Text strong>Incumbent:</Text> {selectedFiling.is_incumbent ? "Yes" : "No"}</div>
              </Space>
            </Card>

            <div>
              <Text strong>Enrichment Fields (Optional)</Text>
              <Space direction="vertical" size="middle" style={{ width: "100%", marginTop: 12 }}>
                <div>
                  <Text>Photo URL</Text>
                  <Input placeholder="https://example.com/photo.jpg" value={promoteForm.photoUrl} onChange={(e) => setPromoteForm({ ...promoteForm, photoUrl: e.target.value })} />
                </div>
                <div>
                  <Text>Website URL</Text>
                  <Input placeholder="https://candidate.com" value={promoteForm.website} onChange={(e) => setPromoteForm({ ...promoteForm, website: e.target.value })} />
                </div>
                <div>
                  <Text>Twitter Handle</Text>
                  <Input placeholder="@candidate" value={promoteForm.twitter} onChange={(e) => setPromoteForm({ ...promoteForm, twitter: e.target.value })} />
                </div>
                <div>
                  <Text>Role Title</Text>
                  <Input placeholder="U.S. Senator" value={promoteForm.roleTitle} onChange={(e) => setPromoteForm({ ...promoteForm, roleTitle: e.target.value })} />
                </div>
                <div>
                  <Text>Bio</Text>
                  <TextArea rows={4} placeholder="Candidate biography..." value={promoteForm.bio} onChange={(e) => setPromoteForm({ ...promoteForm, bio: e.target.value })} />
                </div>
                <div>
                  <Text strong>Race Status *</Text>
                  <Select
                    style={{ width: "100%", marginTop: 4 }}
                    value={promoteForm.raceStatus}
                    onChange={(value) => setPromoteForm({ ...promoteForm, raceStatus: value })}
                  >
                    <Select.Option value="announced">Announced</Select.Option>
                    <Select.Option value="primary_winner">Primary Winner</Select.Option>
                    <Select.Option value="runoff">Runoff</Select.Option>
                  </Select>
                </div>
              </Space>
            </div>
          </Space>
        )}
      </Modal>

      {/* Bulk Promote Modal */}
      <Modal
        title={`Bulk Promote ${selectedRowKeys.length} Candidate${selectedRowKeys.length !== 1 ? "s" : ""}`}
        open={bulkPromoteOpen}
        onCancel={() => setBulkPromoteOpen(false)}
        okText="Promote All"
        okButtonProps={{ loading: bulkPromoting }}
        onOk={handleBulkPromote}
        width={isMobile ? "100vw" : 600}
        style={isMobile ? { top: 0, maxWidth: "100vw", margin: 0, paddingBottom: 0 } : undefined}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            This will promote the selected FEC filings to full candidates, create their race assignments,
            and mark them as "Announced" status. Already-promoted candidates will be skipped.
          </Text>
        </div>

        {selectedRowKeys.length > 0 && (
          <Alert
            type="info"
            showIcon
            style={{ fontSize: 13 }}
            message={
              <>
                Promoting {selectedRowKeys.length} filing{selectedRowKeys.length !== 1 ? "s" : ""} to candidates
              </>
            }
          />
        )}
      </Modal>
    </>
  );
}

// ═══════════════════════════════════════════
// Sync Tab
// ═══════════════════════════════════════════

function SyncTab({
  messageApi,
  onSyncComplete,
  isMobile,
}: {
  messageApi: ReturnType<typeof message.useMessage>[0];
  onSyncComplete: () => void;
  isMobile: boolean;
}) {
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
      setConnectionInfo(`API key valid. FEC has ${result.count.toLocaleString()} total Senate filings for ${cycle}.`);
    } else {
      setConnectionStatus("error");
      setConnectionInfo(`Connection failed: ${result.error}`);
    }
  }

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
        candidates.push(...(await client.getCandidates({ ...fetchParams, office: "S" })));
      }
      if (officeFilter === "H" || officeFilter === "both") {
        candidates.push(...(await client.getCandidates({ ...fetchParams, office: "H" })));
      }

      const majorParties = new Set(["DEM", "REP", "IND", "NNE", "NPA"]);
      if (majorPartiesOnly) {
        candidates = candidates.filter((c) => majorParties.has(c.party) || !c.party);
      }

      const seenFecIds = new Set<string>();
      const deduped: FecCandidate[] = [];
      for (const c of candidates) {
        if (seenFecIds.has(c.candidate_id)) continue;
        seenFecIds.add(c.candidate_id);
        deduped.push(c);
      }
      candidates = deduped;

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
          selected: !existingFilingId,
          financials: null,
        };
      });

      preview.sort((a, b) => {
        if (a.existsInFilings !== b.existsInFilings) return a.existsInFilings ? 1 : -1;
        const stateCompare = a.fec.state.localeCompare(b.fec.state);
        if (stateCompare !== 0) return stateCompare;
        return a.parsedLast.localeCompare(b.parsedLast);
      });

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
          // Non-fatal
        }
      }
      setImportStatus("");
      setImportProgress(0);

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
            <li>Update {selected.filter((s) => s.existsInFilings).length} existing filings</li>
            <li>Store data in the staging table (not live candidates table)</li>
          </ul>
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

    const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

    try {
      const { data: activeCycle } = await supabase
        .from("election_cycles")
        .select("id")
        .eq("is_active", true)
        .single();

      if (!activeCycle) {
        result.errors.push("No active election cycle found.");
        setImportResult(result);
        setStep("done");
        return;
      }

      const { data: states } = await supabase.from("states").select("id, abbr");
      const stateMap = new Map<string, number>();
      for (const s of states ?? []) stateMap.set(s.abbr, s.id);

      const total = selected.length;
      for (let i = 0; i < selected.length; i++) {
        const item = selected[i];
        setImportProgress(Math.round(((i + 1) / total) * 100));
        setImportStatus(`Processing ${item.parsedFirst} ${item.parsedLast} (${i + 1}/${total})`);

        const stateId = stateMap.get(item.fec.state);
        if (!stateId) {
          result.errors.push(`Unknown state: ${item.fec.state}`);
          result.skipped++;
          continue;
        }

        const { error } = await supabase
          .from("fec_filings")
          .upsert(
            {
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
            },
            { onConflict: "cycle_id,fec_candidate_id" }
          )
          .select("id")
          .single();

        if (error) {
          result.errors.push(`${item.parsedFirst} ${item.parsedLast}: ${error.message}`);
          result.skipped++;
          continue;
        }

        if (item.existsInFilings) result.updated++;
        else result.created++;
      }
    } catch (err: any) {
      result.errors.push(`Fatal error: ${err.message}`);
    }

    setImportResult(result);
    setImporting(false);
    setStep("done");
  }

  function toggleAll(checked: boolean) {
    setPreviewCandidates((prev) => prev.map((p) => ({ ...p, selected: checked })));
  }

  function toggleCandidate(index: number) {
    setPreviewCandidates((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
    );
  }

  const newCount = previewCandidates.filter((p) => !p.existsInFilings).length;
  const existingCount = previewCandidates.filter((p) => p.existsInFilings).length;
  const selectedCount = previewCandidates.filter((p) => p.selected).length;

  return (
    <div>
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message="OpenFEC Integration"
        description={
          <span>
            Sync FEC filings to staging table. After primaries, promote winners from the Filed Candidates tab.
            {" "}
            <a href="https://api.open.fec.gov/developers/" target="_blank" rel="noopener noreferrer">
              Get a free API key
            </a>
          </span>
        }
        style={{ marginBottom: 16 }}
      />

      {/* Connection */}
      <Card
        title={<Space><ApiOutlined /><span>API Connection</span>{connectionStatus === "ok" && <Tag color="success" icon={<CheckCircleOutlined />}>Connected</Tag>}</Space>}
        size="small"
        style={{ marginBottom: 16 }}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <Input.Password placeholder="OpenFEC API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} style={{ flex: 1 }} onPressEnter={testConnection} />
          <Button onClick={testConnection} loading={connectionStatus === "testing"} icon={<ThunderboltOutlined />}>Test</Button>
        </div>
        {connectionStatus === "ok" && <Text type="success" style={{ fontSize: 13 }}><CheckCircleOutlined /> {connectionInfo}</Text>}
        {connectionStatus === "error" && <Text type="danger" style={{ fontSize: 13 }}><ExclamationCircleOutlined /> {connectionInfo}</Text>}
      </Card>

      {/* Fetch & Filter */}
      {connectionStatus === "ok" && (
        <Card title={<Space><CloudDownloadOutlined /><span>Fetch Candidates</span></Space>} size="small" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12, alignItems: "flex-end", flexDirection: isMobile ? "column" : "row" }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Cycle</Text>
              <Select value={cycle} onChange={setCycle} style={{ width: isMobile ? "100%" : 100 }} options={[{ value: 2026, label: "2026" }, { value: 2024, label: "2024" }, { value: 2028, label: "2028" }]} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Office</Text>
              <Select value={officeFilter} onChange={setOfficeFilter} style={{ width: isMobile ? "100%" : 140 }} options={[{ value: "S", label: "Senate only" }, { value: "H", label: "House only" }, { value: "both", label: "Senate + House" }]} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>State</Text>
              <Select
                placeholder="All states"
                value={stateFilter || undefined}
                onChange={(val) => setStateFilter(val ?? "")}
                allowClear
                showSearch
                style={{ width: isMobile ? "100%" : 140 }}
                options={[
                  { value: "AL", label: "AL — Alabama" }, { value: "AK", label: "AK — Alaska" }, { value: "AZ", label: "AZ — Arizona" },
                  { value: "AR", label: "AR — Arkansas" }, { value: "CA", label: "CA — California" }, { value: "CO", label: "CO — Colorado" },
                  { value: "CT", label: "CT — Connecticut" }, { value: "DE", label: "DE — Delaware" }, { value: "FL", label: "FL — Florida" },
                  { value: "GA", label: "GA — Georgia" }, { value: "HI", label: "HI — Hawaii" }, { value: "ID", label: "ID — Idaho" },
                  { value: "IL", label: "IL — Illinois" }, { value: "IN", label: "IN — Indiana" }, { value: "IA", label: "IA — Iowa" },
                  { value: "KS", label: "KS — Kansas" }, { value: "KY", label: "KY — Kentucky" }, { value: "LA", label: "LA — Louisiana" },
                  { value: "ME", label: "ME — Maine" }, { value: "MD", label: "MD — Maryland" }, { value: "MA", label: "MA — Massachusetts" },
                  { value: "MI", label: "MI — Michigan" }, { value: "MN", label: "MN — Minnesota" }, { value: "MS", label: "MS — Mississippi" },
                  { value: "MO", label: "MO — Missouri" }, { value: "MT", label: "MT — Montana" }, { value: "NE", label: "NE — Nebraska" },
                  { value: "NV", label: "NV — Nevada" }, { value: "NH", label: "NH — New Hampshire" }, { value: "NJ", label: "NJ — New Jersey" },
                  { value: "NM", label: "NM — New Mexico" }, { value: "NY", label: "NY — New York" }, { value: "NC", label: "NC — North Carolina" },
                  { value: "ND", label: "ND — North Dakota" }, { value: "OH", label: "OH — Ohio" }, { value: "OK", label: "OK — Oklahoma" },
                  { value: "OR", label: "OR — Oregon" }, { value: "PA", label: "PA — Pennsylvania" }, { value: "RI", label: "RI — Rhode Island" },
                  { value: "SC", label: "SC — South Carolina" }, { value: "SD", label: "SD — South Dakota" }, { value: "TN", label: "TN — Tennessee" },
                  { value: "TX", label: "TX — Texas" }, { value: "UT", label: "UT — Utah" }, { value: "VT", label: "VT — Vermont" },
                  { value: "VA", label: "VA — Virginia" }, { value: "WA", label: "WA — Washington" }, { value: "WV", label: "WV — West Virginia" },
                  { value: "WI", label: "WI — Wisconsin" }, { value: "WY", label: "WY — Wyoming" }, { value: "DC", label: "DC — District of Columbia" },
                ]}
              />
            </div>
            <div style={{ display: "flex", gap: 16, paddingBottom: 4, flexWrap: "wrap" }}>
              <Checkbox checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)}>Active only</Checkbox>
              <Checkbox checked={onlyFunded} onChange={(e) => setOnlyFunded(e.target.checked)}>
                <Tooltip title="Filters out ~80% of filings"><span style={{ borderBottom: "1px dashed #999" }}>Has raised funds</span></Tooltip>
              </Checkbox>
              <Checkbox checked={majorPartiesOnly} onChange={(e) => setMajorPartiesOnly(e.target.checked)}>
                <Tooltip title="Democrat, Republican, and Independent only"><span style={{ borderBottom: "1px dashed #999" }}>Major parties only</span></Tooltip>
              </Checkbox>
              <Checkbox checked={minFiveK} onChange={(e) => setMinFiveK(e.target.checked)}>
                <Tooltip title="Only candidates who have raised at least $5,000"><span style={{ borderBottom: "1px dashed #999" }}>Min $5K raised</span></Tooltip>
              </Checkbox>
            </div>
          </div>

          <Button type="primary" icon={<CloudDownloadOutlined />} onClick={fetchPreview} loading={previewing}>Fetch from FEC</Button>

          {previewing && importStatus && (
            <div style={{ marginTop: 12 }}>
              <Progress percent={importProgress} size="small" status="active" />
              <Text type="secondary" style={{ fontSize: 12 }}>{importStatus}</Text>
            </div>
          )}
          {previewError && <Alert type="error" message={previewError} style={{ marginTop: 12 }} closable onClose={() => setPreviewError("")} />}
        </Card>
      )}

      {/* Preview */}
      {step === "preview" && previewCandidates.length > 0 && (
        <Card
          title={<Space><span>Preview ({previewCandidates.length} candidates)</span><Badge count={newCount} style={{ backgroundColor: "#52c41a" }} title={`${newCount} new`} />{existingCount > 0 && <Badge count={existingCount} style={{ backgroundColor: "#faad14" }} title={`${existingCount} already synced`} />}</Space>}
          size="small"
          style={{ marginBottom: 16 }}
          extra={
            <Space size="small" wrap>
              <Text type="secondary" style={{ fontSize: 12 }}>{selectedCount} selected</Text>
              <Button size="small" onClick={() => toggleAll(true)}>All</Button>
              <Button size="small" onClick={() => toggleAll(false)}>None</Button>
              <Button size="small" onClick={() => setPreviewCandidates((prev) => prev.map((p) => ({ ...p, selected: !p.existsInFilings })))}>New Only</Button>
              <Divider type="vertical" />
              <Button type="primary" icon={<SyncOutlined />} onClick={runImport} disabled={selectedCount === 0}>Sync ({selectedCount})</Button>
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
              { title: "", key: "select", width: 40, render: (_, __, index) => <Checkbox checked={previewCandidates[index].selected} onChange={() => toggleCandidate(index)} /> },
              {
                title: "Status", key: "status", width: 80,
                filters: [{ text: "New", value: "new" }, { text: "Exists", value: "exists" }],
                onFilter: (value, record) => value === "new" ? !record.existsInFilings : record.existsInFilings,
                render: (_, record: PreviewCandidate) => record.existsInFilings ? <Tag color="warning">Synced</Tag> : <Tag color="success">New</Tag>,
              },
              {
                title: "Name", key: "name",
                sorter: (a: PreviewCandidate, b: PreviewCandidate) => a.parsedLast.localeCompare(b.parsedLast),
                render: (_, record: PreviewCandidate) => (<div><Text strong>{record.parsedFirst} {record.parsedLast}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>FEC: {record.fec.name}</Text></div>),
              },
              {
                title: "Party", key: "party", width: 100,
                render: (_, record: PreviewCandidate) => {
                  const colors: Record<string, string> = { Democrat: "blue", Republican: "red", Independent: "purple", Libertarian: "gold", Green: "green" };
                  return <Tag color={colors[record.mappedParty] ?? "default"}>{record.mappedParty}</Tag>;
                },
              },
              { title: "State", dataIndex: ["fec", "state"], key: "state", width: 60, sorter: (a: PreviewCandidate, b: PreviewCandidate) => a.fec.state.localeCompare(b.fec.state) },
              {
                title: "Type", key: "type", width: 90,
                render: (_, record: PreviewCandidate) => {
                  if (record.fec.incumbent_challenge === "I") return <Tag color="green">Incumbent</Tag>;
                  if (record.fec.incumbent_challenge === "C") return <Tag>Challenger</Tag>;
                  return <Tag color="orange">Open</Tag>;
                },
              },
              {
                title: "Raised", key: "raised", width: 90,
                sorter: (a: PreviewCandidate, b: PreviewCandidate) => (a.financials?.raised ?? 0) - (b.financials?.raised ?? 0),
                render: (_: unknown, record: PreviewCandidate) => record.financials ? <Text style={{ fontSize: 12, fontFamily: "monospace" }}>{formatMoney(record.financials.raised)}</Text> : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
              },
              {
                title: "Spent", key: "spent", width: 90,
                render: (_: unknown, record: PreviewCandidate) => record.financials ? <Text style={{ fontSize: 12, fontFamily: "monospace" }}>{formatMoney(record.financials.spent)}</Text> : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
              },
              {
                title: "Cash", key: "cash", width: 90,
                render: (_: unknown, record: PreviewCandidate) => record.financials ? <Text style={{ fontSize: 12, fontFamily: "monospace" }}>{formatMoney(record.financials.cash)}</Text> : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
              },
              {
                title: "FEC ID", dataIndex: ["fec", "candidate_id"], key: "fec_id", width: 110,
                render: (id: string) => <Tooltip title="View on FEC.gov"><a href={`https://www.fec.gov/data/candidate/${id}/`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "monospace", fontSize: 12 }}>{id}</a></Tooltip>,
              },
            ]}
          />
        </Card>
      )}

      {step === "preview" && previewCandidates.length === 0 && !previewing && (
        <Alert type="warning" message="No candidates found" description="Try adjusting your filters." style={{ marginBottom: 16 }} />
      )}

      {/* Importing */}
      {step === "importing" && (
        <Card style={{ marginBottom: 16, textAlign: "center", padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 20 }}>
            <Progress percent={importProgress} status="active" />
            <Text style={{ display: "block", marginTop: 8 }}>{importStatus}</Text>
          </div>
        </Card>
      )}

      {/* Done */}
      {step === "done" && importResult && (
        <Card title="Sync Complete" style={{ marginBottom: 16 }}>
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={isMobile ? 12 : 8}><Statistic title="Created" value={importResult.created} valueStyle={{ color: "#52c41a" }} prefix={<CheckCircleOutlined />} /></Col>
            <Col span={isMobile ? 12 : 8}><Statistic title="Updated" value={importResult.updated} valueStyle={{ color: "#1890ff" }} prefix={<SyncOutlined />} /></Col>
            <Col span={isMobile ? 12 : 8}><Statistic title="Skipped" value={importResult.skipped} /></Col>
          </Row>
          {importResult.errors.length > 0 && (
            <Alert
              type="warning"
              message={`${importResult.errors.length} issues`}
              description={<ul style={{ maxHeight: 200, overflow: "auto", paddingLeft: 20, margin: 0 }}>{importResult.errors.map((e, i) => <li key={i} style={{ fontSize: 12 }}>{e}</li>)}</ul>}
              style={{ marginBottom: 12 }}
            />
          )}
          <Space>
            <Button type="primary" onClick={() => { setStep("connect"); setPreviewCandidates([]); setImportResult(null); }}>Sync More</Button>
            <Button onClick={onSyncComplete}>View Filed Candidates</Button>
          </Space>
        </Card>
      )}
    </div>
  );
}
