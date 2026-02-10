import { useState, useCallback, useEffect, type ReactNode } from "react";
import { Table, Card, Select, Tag, Button, Modal, Input, Typography, Space, message, Statistic, Badge, Tooltip, Alert } from "antd";
import { CheckCircleOutlined, DeleteOutlined, SendOutlined, ExclamationCircleOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { supabase } from "../../lib/supabase";
import { slugifyName } from "../../lib/openfec";
import { getEnrichmentData } from "../../lib/congress-api";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface FilingsPageProps {
  setHeaderActions: (actions: ReactNode) => void;
}

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
  state?: {
    name: string;
    abbr: string;
  };
}

interface PromoteFormData {
  photoUrl: string;
  website: string;
  twitter: string;
  bio: string;
  roleTitle: string;
  raceStatus: "announced" | "primary_winner" | "runoff";
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

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function FilingsPage({ setHeaderActions }: FilingsPageProps) {
  const [filings, setFilings] = useState<DbFecFiling[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCycleId, setActiveCycleId] = useState<number | null>(null);

  // Filters
  const [stateFilter, setStateFilter] = useState<number | null>(null);
  const [partyFilter, setPartyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Promote modal
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
  const [enriching, setEnriching] = useState(false);
  const [enrichedFrom, setEnrichedFrom] = useState<string | null>(null);

  useEffect(() => {
    setHeaderActions(null);
  }, [setHeaderActions]);

  useEffect(() => {
    fetchActiveCycle();
  }, []);

  useEffect(() => {
    if (activeCycleId !== null) {
      fetchFilings();
    }
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
      message.error("Failed to fetch active cycle");
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
      message.error("Failed to fetch filings");
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteClick = async (filing: DbFecFiling) => {
    setSelectedFiling(filing);
    setEnrichedFrom(null);

    const defaultForm: PromoteFormData = {
      photoUrl: "",
      website: "",
      twitter: "",
      bio: "",
      roleTitle: filing.office === "S" ? "U.S. Senator" : "U.S. Representative",
      raceStatus: "announced",
    };

    setPromoteForm(defaultForm);
    setPromoteModalVisible(true);

    // Auto-enrich incumbents from congress-legislators data
    if (filing.is_incumbent && filing.state?.abbr) {
      setEnriching(true);
      try {
        const data = await getEnrichmentData(
          filing.fec_candidate_id,
          filing.first_name,
          filing.last_name,
          filing.state.abbr
        );
        if (data) {
          setPromoteForm((prev) => ({
            ...prev,
            photoUrl: data.photoUrl || prev.photoUrl,
            website: data.website || prev.website,
            twitter: data.twitter || prev.twitter,
          }));
          setEnrichedFrom(data.bioguideId);
        }
      } catch (err) {
        console.warn("Auto-enrichment failed (non-blocking):", err);
      } finally {
        setEnriching(false);
      }
    }
  };

  const handlePromote = async () => {
    if (!selectedFiling || !activeCycleId) return;

    setPromoting(true);
    try {
      // 1. Create candidate record
      let slug = slugifyName(selectedFiling.first_name, selectedFiling.last_name);

      // Check for slug collision
      const { data: existingCandidate } = await supabase
        .from("candidates")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existingCandidate) {
        const stateAbbr = selectedFiling.state?.abbr?.toLowerCase() || "";
        slug = `${slug}-${stateAbbr}`;
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
          bioguide_id: enrichedFrom || null,
          funds_raised: selectedFiling.funds_raised,
          funds_spent: selectedFiling.funds_spent,
          cash_on_hand: selectedFiling.cash_on_hand,
          fec_financials_updated_at: selectedFiling.last_synced_at,
        })
        .select()
        .single();

      if (candidateError) throw candidateError;

      // 2. Look up district
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
        // Auto-create district if it doesn't exist
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

      // 3. Look up race for this district in active cycle
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
        // Auto-create race if it doesn't exist
        const { data: newRace, error: raceError } = await supabase
          .from("races")
          .insert({
            district_id: districtId,
            cycle_id: activeCycleId,
            rating: null,
          })
          .select()
          .single();

        if (raceError) throw raceError;
        raceId = newRace.id;
      }

      // 4. Create race_candidates link
      const { error: raceCandidateError } = await supabase
        .from("race_candidates")
        .insert({
          race_id: raceId,
          candidate_id: newCandidate.id,
          status: promoteForm.raceStatus,
          is_incumbent: selectedFiling.is_incumbent,
        });

      if (raceCandidateError) throw raceCandidateError;

      // 5. Update fec_filings.promoted_to_candidate_id
      const { error: updateError } = await supabase
        .from("fec_filings")
        .update({ promoted_to_candidate_id: newCandidate.id })
        .eq("id", selectedFiling.id);

      if (updateError) throw updateError;

      message.success(`Promoted ${selectedFiling.name} to candidate`);
      setPromoteModalVisible(false);
      fetchFilings();
    } catch (err) {
      console.error("Error promoting filing:", err);
      message.error("Failed to promote filing");
    } finally {
      setPromoting(false);
    }
  };

  const handleDelete = (filing: DbFecFiling) => {
    Modal.confirm({
      title: "Delete Filing",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete the filing for ${filing.name}? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const { error } = await supabase
            .from("fec_filings")
            .delete()
            .eq("id", filing.id);

          if (error) throw error;
          message.success("Filing deleted");
          fetchFilings();
        } catch (err) {
          console.error("Error deleting filing:", err);
          message.error("Failed to delete filing");
        }
      },
    });
  };

  const filteredFilings = filings.filter((f) => {
    if (stateFilter !== null && f.state_id !== stateFilter) return false;
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
      width: 80,
      sorter: (a: DbFecFiling, b: DbFecFiling) =>
        (a.state?.abbr || "").localeCompare(b.state?.abbr || ""),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: DbFecFiling, b: DbFecFiling) => a.name.localeCompare(b.name),
    },
    {
      title: "Party",
      dataIndex: "party",
      key: "party",
      width: 120,
      render: (party: string) => {
        let color = "default";
        if (party === "Democrat") color = "blue";
        else if (party === "Republican") color = "red";
        else if (party === "Independent") color = "purple";
        return <Tag color={color}>{party}</Tag>;
      },
    },
    {
      title: "Office",
      dataIndex: "office",
      key: "office",
      width: 100,
      render: (office: string, record: DbFecFiling) => {
        if (office === "S") return "Senate";
        return `House ${record.district_number}`;
      },
    },
    {
      title: "Incumbent",
      dataIndex: "is_incumbent",
      key: "is_incumbent",
      width: 100,
      render: (isIncumbent: boolean) =>
        isIncumbent ? <Tag color="green">Incumbent</Tag> : null,
    },
    {
      title: "Raised",
      dataIndex: "funds_raised",
      key: "funds_raised",
      width: 100,
      sorter: (a: DbFecFiling, b: DbFecFiling) => a.funds_raised - b.funds_raised,
      render: (n: number) => formatMoney(n),
    },
    {
      title: "Spent",
      dataIndex: "funds_spent",
      key: "funds_spent",
      width: 100,
      render: (n: number) => formatMoney(n),
    },
    {
      title: "Cash",
      dataIndex: "cash_on_hand",
      key: "cash_on_hand",
      width: 100,
      render: (n: number) => formatMoney(n),
    },
    {
      title: "Synced",
      dataIndex: "last_synced_at",
      key: "last_synced_at",
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Status",
      dataIndex: "promoted_to_candidate_id",
      key: "status",
      width: 120,
      render: (promotedId: number | null) =>
        promotedId ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Promoted
          </Tag>
        ) : (
          <Tag color="default">Not Promoted</Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      render: (_: any, record: DbFecFiling) => (
        <Space size="small">
          {!record.promoted_to_candidate_id && (
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handlePromoteClick(record)}
            >
              Promote
            </Button>
          )}
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>FEC Filings</Title>
      <Text type="secondary">
        View and manage FEC filings synced to the staging table. Promote filings
        to candidates to add them to races.
      </Text>

      <Card style={{ marginTop: 24 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Space wrap>
            <Select
              placeholder="Filter by state"
              style={{ width: 200 }}
              allowClear
              showSearch
              value={stateFilter}
              onChange={setStateFilter}
              filterOption={(input, option) =>
                (option?.label?.toString() || "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {US_STATES.map((state) => (
                <Select.Option key={state.value} value={state.value} label={state.label}>
                  {state.abbr} - {state.label}
                </Select.Option>
              ))}
            </Select>

            <Select
              placeholder="Filter by party"
              style={{ width: 150 }}
              value={partyFilter}
              onChange={setPartyFilter}
            >
              <Select.Option value="all">All Parties</Select.Option>
              <Select.Option value="Democrat">Democrat</Select.Option>
              <Select.Option value="Republican">Republican</Select.Option>
              <Select.Option value="Independent">Independent</Select.Option>
            </Select>

            <Select
              placeholder="Filter by status"
              style={{ width: 150 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="not_promoted">Not Promoted</Select.Option>
              <Select.Option value="promoted">Promoted</Select.Option>
            </Select>

            <Statistic
              title="Total Filings"
              value={filteredFilings.length}
              prefix={<Badge status="processing" />}
            />
          </Space>

          <Table
            columns={columns}
            dataSource={filteredFilings}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} filings`,
            }}
          />
        </Space>
      </Card>

      <Modal
        title="Promote Filing to Candidate"
        open={promoteModalVisible}
        onCancel={() => setPromoteModalVisible(false)}
        onOk={handlePromote}
        confirmLoading={promoting}
        width={600}
        okText="Promote"
      >
        {selectedFiling && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Card size="small" title="Filing Data (Read-only)">
              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                <div>
                  <Text strong>Name:</Text> {selectedFiling.name}
                </div>
                <div>
                  <Text strong>Party:</Text> {selectedFiling.party}
                </div>
                <div>
                  <Text strong>State:</Text> {selectedFiling.state?.name} (
                  {selectedFiling.state?.abbr})
                </div>
                <div>
                  <Text strong>Office:</Text>{" "}
                  {selectedFiling.office === "S"
                    ? "Senate"
                    : `House District ${selectedFiling.district_number}`}
                </div>
                <div>
                  <Text strong>FEC ID:</Text> {selectedFiling.fec_candidate_id}
                </div>
                <div>
                  <Text strong>Funds Raised:</Text>{" "}
                  {formatMoney(selectedFiling.funds_raised)}
                </div>
                <div>
                  <Text strong>Funds Spent:</Text>{" "}
                  {formatMoney(selectedFiling.funds_spent)}
                </div>
                <div>
                  <Text strong>Cash on Hand:</Text>{" "}
                  {formatMoney(selectedFiling.cash_on_hand)}
                </div>
                <div>
                  <Text strong>Incumbent:</Text>{" "}
                  {selectedFiling.is_incumbent ? "Yes" : "No"}
                </div>
              </Space>
            </Card>

            <div>
              <Text strong>Enrichment Fields (Optional)</Text>
              {enriching && (
                <Alert
                  message="Looking up Congress data..."
                  type="info"
                  showIcon
                  icon={<ThunderboltOutlined />}
                  style={{ marginTop: 8 }}
                />
              )}
              {enrichedFrom && !enriching && (
                <Alert
                  message={`Auto-enriched from Congress data (${enrichedFrom})`}
                  type="success"
                  showIcon
                  icon={<ThunderboltOutlined />}
                  style={{ marginTop: 8 }}
                />
              )}
              <Space direction="vertical" size="middle" style={{ width: "100%", marginTop: 12 }}>
                <div>
                  <Text>Photo URL</Text>
                  <Input
                    placeholder="https://example.com/photo.jpg"
                    value={promoteForm.photoUrl}
                    onChange={(e) =>
                      setPromoteForm({ ...promoteForm, photoUrl: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Text>Website URL</Text>
                  <Input
                    placeholder="https://candidate.com"
                    value={promoteForm.website}
                    onChange={(e) =>
                      setPromoteForm({ ...promoteForm, website: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Text>Twitter Handle</Text>
                  <Input
                    placeholder="@candidate"
                    value={promoteForm.twitter}
                    onChange={(e) =>
                      setPromoteForm({ ...promoteForm, twitter: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Text>Role Title</Text>
                  <Input
                    placeholder="U.S. Senator"
                    value={promoteForm.roleTitle}
                    onChange={(e) =>
                      setPromoteForm({ ...promoteForm, roleTitle: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Text>Bio</Text>
                  <TextArea
                    rows={4}
                    placeholder="Candidate biography..."
                    value={promoteForm.bio}
                    onChange={(e) =>
                      setPromoteForm({ ...promoteForm, bio: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Text strong>Race Status *</Text>
                  <Select
                    style={{ width: "100%", marginTop: 4 }}
                    value={promoteForm.raceStatus}
                    onChange={(value) =>
                      setPromoteForm({ ...promoteForm, raceStatus: value })
                    }
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
    </div>
  );
}
