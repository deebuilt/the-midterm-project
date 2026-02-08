import { useState, useEffect } from "react";
import { Table, Tag, Badge, Typography, Spin, Card } from "antd";
import { supabase } from "../../lib/supabase";

const { Title } = Typography;

interface CycleRow {
  id: number;
  name: string;
  year: number;
  election_date: string;
  type: string;
  is_active: boolean;
  description: string | null;
}

interface RaceBreakdown {
  body_name: string;
  count: number;
}

export default function CyclesPage() {
  const [cycles, setCycles] = useState<CycleRow[]>([]);
  const [raceCounts, setRaceCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: cycleData } = await supabase
        .from("election_cycles")
        .select("*")
        .order("year", { ascending: false });

      setCycles(cycleData ?? []);

      // Get race counts per cycle
      if (cycleData?.length) {
        const { data: races } = await supabase
          .from("races")
          .select("id, cycle_id");

        const counts: Record<number, number> = {};
        for (const race of races ?? []) {
          counts[race.cycle_id] = (counts[race.cycle_id] ?? 0) + 1;
        }
        setRaceCounts(counts);
      }

      setLoading(false);
    }

    load();
  }, []);

  const typeColors: Record<string, string> = {
    midterm: "blue",
    presidential: "purple",
    special: "orange",
    primary: "cyan",
    runoff: "gold",
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      sorter: (a: CycleRow, b: CycleRow) => a.year - b.year,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={typeColors[type] ?? "default"}>{type}</Tag>
      ),
    },
    {
      title: "Election Date",
      dataIndex: "election_date",
      key: "election_date",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Status",
      key: "is_active",
      render: (_: unknown, record: CycleRow) =>
        record.is_active ? (
          <Badge status="success" text="Active" />
        ) : (
          <Badge status="default" text="Inactive" />
        ),
    },
    {
      title: "Races",
      key: "races",
      render: (_: unknown, record: CycleRow) => raceCounts[record.id] ?? 0,
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
      <Title level={3} style={{ marginBottom: 24 }}>
        Election Cycles
      </Title>

      <Card style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <Table
          dataSource={cycles}
          columns={columns}
          rowKey="id"
          pagination={false}
          expandable={{
            expandedRowRender: (record) => (
              <CycleDetail cycleId={record.id} description={record.description} />
            ),
          }}
        />
      </Card>
    </div>
  );
}

function CycleDetail({
  cycleId,
  description,
}: {
  cycleId: number;
  description: string | null;
}) {
  const [breakdown, setBreakdown] = useState<RaceBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("races")
        .select("id, district:districts(body:government_bodies(name))")
        .eq("cycle_id", cycleId);

      const countMap: Record<string, number> = {};
      for (const race of data ?? []) {
        const bodyName =
          (race.district as any)?.body?.name ?? "Unknown";
        countMap[bodyName] = (countMap[bodyName] ?? 0) + 1;
      }

      setBreakdown(
        Object.entries(countMap).map(([body_name, count]) => ({
          body_name,
          count,
        }))
      );
      setLoading(false);
    }

    load();
  }, [cycleId]);

  if (loading) return <Spin size="small" />;

  return (
    <div>
      {description && (
        <p style={{ marginBottom: 12, color: "#666" }}>{description}</p>
      )}
      <Table
        dataSource={breakdown}
        columns={[
          { title: "Body", dataIndex: "body_name", key: "body_name" },
          { title: "Races", dataIndex: "count", key: "count" },
        ]}
        rowKey="body_name"
        pagination={false}
        size="small"
      />
    </div>
  );
}
