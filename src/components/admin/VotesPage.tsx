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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../../lib/supabase";

const { Text } = Typography;
const { TextArea } = Input;

// ─── Types ───

interface VoteRow {
  id: number;
  candidate_id: number;
  bill_name: string;
  bill_number: string | null;
  vote: string;
  vote_date: string | null;
  topic_id: number | null;
  summary: string | null;
  source_url: string | null;
  created_at: string;
  // Joined
  candidate?: { first_name: string; last_name: string; party: string; state?: { abbr: string } };
  topic?: { name: string } | null;
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

// ─── Component ───

export default function VotesPage({ setHeaderActions }: Props) {
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingVote, setEditingVote] = useState<VoteRow | null>(null);
  const [topicsDrawerOpen, setTopicsDrawerOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [topicLoading, setTopicLoading] = useState(false);

  // Filters
  const [filterCandidate, setFilterCandidate] = useState<string>("");
  const [filterVote, setFilterVote] = useState<string>("all");

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // ─── Header Actions ───

  useEffect(() => {
    setHeaderActions(
      <Space>
        <Button size="small" icon={<TagsOutlined />} onClick={() => setTopicsDrawerOpen(true)}>
          Topics
        </Button>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Add Vote
        </Button>
      </Space>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  // ─── Data Loading ───

  async function loadVotes() {
    const { data, error } = await supabase
      .from("votes")
      .select(`
        *,
        candidate:candidates!inner(first_name, last_name, party, state:states(abbr)),
        topic:topics(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      messageApi.error(`Failed to load votes: ${error.message}`);
      return;
    }
    setVotes((data ?? []) as unknown as VoteRow[]);
  }

  async function loadCandidates() {
    const { data } = await supabase
      .from("candidates")
      .select("id, first_name, last_name, party, is_incumbent, state:states(abbr)")
      .eq("is_incumbent", true)
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
    Promise.all([loadVotes(), loadCandidates(), loadTopics()]).then(() =>
      setLoading(false)
    );
  }, []);

  // ─── CRUD ───

  function openCreateModal() {
    setEditingVote(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(vote: VoteRow) {
    setEditingVote(vote);
    form.setFieldsValue({
      candidate_id: vote.candidate_id,
      bill_name: vote.bill_name,
      bill_number: vote.bill_number,
      vote: vote.vote,
      vote_date: vote.vote_date ? dayjs(vote.vote_date) : null,
      topic_id: vote.topic_id,
      summary: vote.summary,
      source_url: vote.source_url,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    try {
      const values = await form.validateFields();
      setModalLoading(true);

      const payload = {
        candidate_id: values.candidate_id,
        bill_name: values.bill_name,
        bill_number: values.bill_number || null,
        vote: values.vote,
        vote_date: values.vote_date ? values.vote_date.format("YYYY-MM-DD") : null,
        topic_id: values.topic_id || null,
        summary: values.summary || null,
        source_url: values.source_url || null,
      };

      if (editingVote) {
        const { error } = await supabase
          .from("votes")
          .update(payload)
          .eq("id", editingVote.id);
        if (error) throw error;
        messageApi.success("Vote updated");
      } else {
        const { error } = await supabase.from("votes").insert(payload);
        if (error) throw error;
        messageApi.success("Vote created");
      }

      setModalOpen(false);
      form.resetFields();
      setEditingVote(null);
      await loadVotes();
    } catch (err: any) {
      messageApi.error(err.message ?? "Failed to save");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleDelete(id: number) {
    const { error } = await supabase.from("votes").delete().eq("id", id);
    if (error) {
      messageApi.error(`Delete failed: ${error.message}`);
    } else {
      messageApi.success("Vote deleted");
      await loadVotes();
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

  const filteredVotes = votes.filter((v) => {
    if (filterCandidate) {
      const name = `${v.candidate?.first_name ?? ""} ${v.candidate?.last_name ?? ""}`.toLowerCase();
      if (!name.includes(filterCandidate.toLowerCase())) return false;
    }
    if (filterVote !== "all" && v.vote !== filterVote) return false;
    return true;
  });

  // ─── Table Columns ───

  const columns = [
    {
      title: "Senator",
      key: "senator",
      width: 200,
      render: (_: any, r: VoteRow) => {
        const c = r.candidate;
        if (!c) return "—";
        return (
          <Space>
            <Tag color={partyColors[c.party] ?? "default"} style={{ margin: 0 }}>
              {c.party?.charAt(0)}
            </Tag>
            <span>
              {c.first_name} {c.last_name}
              {c.state?.abbr && (
                <Text type="secondary" style={{ fontSize: 12 }}> ({c.state.abbr})</Text>
              )}
            </span>
          </Space>
        );
      },
      sorter: (a: VoteRow, b: VoteRow) =>
        (a.candidate?.last_name ?? "").localeCompare(b.candidate?.last_name ?? ""),
    },
    {
      title: "Bill",
      key: "bill",
      width: 220,
      render: (_: any, r: VoteRow) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.bill_name}</div>
          {r.bill_number && <Text type="secondary" style={{ fontSize: 12 }}>{r.bill_number}</Text>}
        </div>
      ),
    },
    {
      title: "Vote",
      dataIndex: "vote",
      key: "vote",
      width: 100,
      render: (v: string) => (
        <Tag color={voteColors[v] ?? "default"}>{v?.toUpperCase()}</Tag>
      ),
      filters: voteOptions.map((o) => ({ text: o.label, value: o.value })),
      onFilter: (value: any, record: VoteRow) => record.vote === value,
    },
    {
      title: "Date",
      dataIndex: "vote_date",
      key: "vote_date",
      width: 110,
      render: (d: string | null) => d ? dayjs(d).format("MMM D, YYYY") : "—",
      sorter: (a: VoteRow, b: VoteRow) => (a.vote_date ?? "").localeCompare(b.vote_date ?? ""),
    },
    {
      title: "Topic",
      key: "topic",
      width: 120,
      render: (_: any, r: VoteRow) => r.topic?.name ?? <Text type="secondary">—</Text>,
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
      render: (_: any, r: VoteRow) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(r)} />
          <Popconfirm title="Delete this vote?" onConfirm={() => handleDelete(r.id)}>
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

  return (
    <div>
      {contextHolder}

      {/* Filters */}
      <div style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Input.Search
          placeholder="Search by senator name..."
          allowClear
          style={{ width: 260 }}
          onSearch={(v) => setFilterCandidate(v)}
          onChange={(e) => {
            if (!e.target.value) setFilterCandidate("");
          }}
        />
        <Select
          value={filterVote}
          onChange={setFilterVote}
          style={{ width: 140 }}
          options={[{ value: "all", label: "All Votes" }, ...voteOptions]}
        />
        <Text type="secondary" style={{ lineHeight: "32px" }}>
          {filteredVotes.length} record{filteredVotes.length !== 1 ? "s" : ""}
        </Text>
      </div>

      {/* Table */}
      <Table
        dataSource={filteredVotes}
        columns={columns as any}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t} votes` }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingVote ? "Edit Vote" : "Add Vote"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingVote(null);
        }}
        onOk={handleSave}
        confirmLoading={modalLoading}
        okText={editingVote ? "Update" : "Create"}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="candidate_id"
            label="Senator"
            rules={[{ required: true, message: "Select a senator" }]}
          >
            <Select
              showSearch
              placeholder="Search senator..."
              optionFilterProp="label"
              options={candidates.map((c) => ({
                value: c.id,
                label: c.label,
              }))}
            />
          </Form.Item>

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

            <Form.Item
              name="vote"
              label="Vote"
              rules={[{ required: true, message: "Select vote" }]}
            >
              <Select options={voteOptions} placeholder="Yea / Nay" />
            </Form.Item>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="vote_date" label="Vote Date">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

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
          </div>

          <Form.Item name="summary" label="Summary">
            <TextArea rows={2} placeholder="Factual, 1-2 sentences about the bill" />
          </Form.Item>

          <Form.Item name="source_url" label="Source URL">
            <Input placeholder="Link to official record" />
          </Form.Item>
        </Form>
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
