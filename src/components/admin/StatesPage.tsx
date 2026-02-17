import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  Table,
  Tag,
  Select,
  Input,
  Button,
  Card,
  Typography,
  message,
  Spin,
} from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { supabase } from "../../lib/supabase";
import type { Party } from "../../lib/database.types";
import { useIsMobile } from "./useIsMobile";

const { Text } = Typography;

interface StateRow {
  id: number;
  name: string;
  abbr: string;
  fips: string;
  house_districts: number;
  current_governor: string | null;
  current_governor_party: Party | null;
  other_senator: string | null;
  other_senator_party: Party | null;
}

interface StatesPageProps {
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

const partyOptions: { value: Party; label: string }[] = [
  { value: "Democrat", label: "Democrat" },
  { value: "Republican", label: "Republican" },
  { value: "Independent", label: "Independent" },
];

export default function StatesPage({ setHeaderActions }: StatesPageProps) {
  const [states, setStates] = useState<StateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<StateRow>>({});
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const isMobile = useIsMobile();

  const loadStates = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("states")
      .select("*")
      .order("name");
    setStates((data as StateRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStates();
  }, [loadStates]);

  useEffect(() => {
    setHeaderActions(null);
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  function startEdit(record: StateRow) {
    setEditingId(record.id);
    setEditValues({
      current_governor: record.current_governor,
      current_governor_party: record.current_governor_party,
      other_senator: record.other_senator,
      other_senator_party: record.other_senator_party,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues({});
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    const { error } = await supabase
      .from("states")
      .update({
        current_governor: editValues.current_governor || null,
        current_governor_party: editValues.current_governor_party || null,
        other_senator: editValues.other_senator || null,
        other_senator_party: editValues.other_senator_party || null,
      })
      .eq("id", editingId);

    if (error) {
      messageApi.error(error.message);
    } else {
      messageApi.success("State updated");
      setEditingId(null);
      setEditValues({});
      loadStates();
    }
    setSaving(false);
  }

  const isEditing = (record: StateRow) => record.id === editingId;

  const columns = [
    {
      title: "State",
      dataIndex: "name",
      key: "name",
      width: 140,
      sorter: (a: StateRow, b: StateRow) => a.name.localeCompare(b.name),
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "House Districts",
      dataIndex: "house_districts",
      key: "house_districts",
      width: 80,
      responsive: ["md"] as ("md")[],
      sorter: (a: StateRow, b: StateRow) => a.house_districts - b.house_districts,
    },
    {
      title: "Current Governor",
      key: "governor",
      width: 220,
      render: (_: unknown, record: StateRow) => {
        if (isEditing(record)) {
          return (
            <div style={{ display: "flex", gap: 6 }}>
              <Input
                size="small"
                placeholder="Name"
                value={editValues.current_governor ?? ""}
                onChange={(e) =>
                  setEditValues((v) => ({ ...v, current_governor: e.target.value }))
                }
                style={{ flex: 1 }}
              />
              <Select
                size="small"
                allowClear
                placeholder="Party"
                value={editValues.current_governor_party}
                onChange={(val) =>
                  setEditValues((v) => ({ ...v, current_governor_party: val ?? null }))
                }
                options={partyOptions}
                style={{ width: 110 }}
              />
            </div>
          );
        }
        if (!record.current_governor) return <Text type="secondary">—</Text>;
        return (
          <span>
            {record.current_governor}{" "}
            {record.current_governor_party && (
              <Tag color={partyColors[record.current_governor_party]} style={{ marginLeft: 4 }}>
                {record.current_governor_party.charAt(0)}
              </Tag>
            )}
          </span>
        );
      },
    },
    {
      title: "Senator (not up in 2026)",
      key: "senator",
      width: 220,
      render: (_: unknown, record: StateRow) => {
        if (isEditing(record)) {
          return (
            <div style={{ display: "flex", gap: 6 }}>
              <Input
                size="small"
                placeholder="Name"
                value={editValues.other_senator ?? ""}
                onChange={(e) =>
                  setEditValues((v) => ({ ...v, other_senator: e.target.value }))
                }
                style={{ flex: 1 }}
              />
              <Select
                size="small"
                allowClear
                placeholder="Party"
                value={editValues.other_senator_party}
                onChange={(val) =>
                  setEditValues((v) => ({ ...v, other_senator_party: val ?? null }))
                }
                options={partyOptions}
                style={{ width: 110 }}
              />
            </div>
          );
        }
        if (!record.other_senator) return <Text type="secondary">—</Text>;
        return (
          <span>
            {record.other_senator}{" "}
            {record.other_senator_party && (
              <Tag color={partyColors[record.other_senator_party]} style={{ marginLeft: 4 }}>
                {record.other_senator_party.charAt(0)}
              </Tag>
            )}
          </span>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 120,
      render: (_: unknown, record: StateRow) => {
        if (isEditing(record)) {
          return (
            <div style={{ display: "flex", gap: 4 }}>
              <Button
                size="small"
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={saveEdit}
              >
                Save
              </Button>
              <Button size="small" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          );
        }
        return (
          <Button size="small" type="link" onClick={() => startEdit(record)}>
            Edit
          </Button>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  function renderPersonWithParty(name: string | null, party: Party | null, label: string) {
    if (!name) return null;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text type="secondary" style={{ fontSize: 11 }}>{label}</Text>
        <div>
          <span style={{ fontSize: 13 }}>{name}</span>
          {party && (
            <Tag color={partyColors[party]} style={{ marginLeft: 4 }}>
              {party.charAt(0)}
            </Tag>
          )}
        </div>
      </div>
    );
  }

  const mobileCards = isMobile && (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {states.map((s) => {
        const editing = isEditing(s);
        return (
          <Card key={s.id} size="small" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Text strong style={{ fontSize: 14 }}>{s.name} ({s.abbr})</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{s.house_districts} districts</Text>
            </div>

            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 11 }}>Governor</Text>
                  <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                    <Input
                      size="small"
                      placeholder="Name"
                      value={editValues.current_governor ?? ""}
                      onChange={(e) => setEditValues((v) => ({ ...v, current_governor: e.target.value }))}
                      style={{ flex: 1 }}
                    />
                    <Select
                      size="small"
                      allowClear
                      placeholder="Party"
                      value={editValues.current_governor_party}
                      onChange={(val) => setEditValues((v) => ({ ...v, current_governor_party: val ?? null }))}
                      options={partyOptions}
                      style={{ width: 100 }}
                    />
                  </div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 11 }}>Senator (not 2026)</Text>
                  <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                    <Input
                      size="small"
                      placeholder="Name"
                      value={editValues.other_senator ?? ""}
                      onChange={(e) => setEditValues((v) => ({ ...v, other_senator: e.target.value }))}
                      style={{ flex: 1 }}
                    />
                    <Select
                      size="small"
                      allowClear
                      placeholder="Party"
                      value={editValues.other_senator_party}
                      onChange={(val) => setEditValues((v) => ({ ...v, other_senator_party: val ?? null }))}
                      options={partyOptions}
                      style={{ width: 100 }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <Button size="small" onClick={cancelEdit}>Cancel</Button>
                  <Button size="small" type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveEdit}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {renderPersonWithParty(s.current_governor, s.current_governor_party, "Governor")}
                {renderPersonWithParty(s.other_senator, s.other_senator_party, "Senator")}
                {!s.current_governor && !s.other_senator && (
                  <Text type="secondary" style={{ fontSize: 12 }}>No data entered</Text>
                )}
                <Button size="small" type="link" onClick={() => startEdit(s)} style={{ alignSelf: "flex-end", padding: 0 }}>
                  Edit
                </Button>
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

      <Text type="secondary" style={{ display: "block", marginBottom: 16, fontSize: 13 }}>
        Manage state-level data: current governor and the senator whose seat is NOT up this cycle.
        {isMobile ? " Tap Edit to modify." : " Click Edit to modify a row inline."}
      </Text>

      {isMobile ? (
        mobileCards
      ) : (
        <Table
          dataSource={states}
          columns={columns}
          rowKey="id"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
          pagination={{ pageSize: 25, showSizeChanger: true }}
          size="small"
        />
      )}
    </div>
  );
}
