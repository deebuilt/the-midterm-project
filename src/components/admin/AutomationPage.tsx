import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  Card,
  Switch,
  InputNumber,
  Input,
  Checkbox,
  Button,
  Table,
  Tag,
  Typography,
  Space,
  Alert,
  Spin,
  message,
  Tooltip,
  Divider,
  Statistic,
  Row,
  Col,
  Modal,
} from "antd";
import {
  RobotOutlined,
  SaveOutlined,
  ThunderboltOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { supabase } from "../../lib/supabase";

const { Text, Title, Paragraph } = Typography;

interface AutomationPageProps {
  setHeaderActions: (actions: ReactNode) => void;
}

interface AutomationConfig {
  fec_sync_enabled: boolean;
  lookahead_days: number;
  lookback_days: number;
  min_funds_raised: number;
  major_parties_only: boolean;
  active_only: boolean;
  vercel_deploy_hook: string | null;
  webhook_secret: string | null;
  last_sync_at: string | null;
}

interface SyncLog {
  id: number;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  states_synced: string[] | null;
  filings_created: number;
  filings_updated: number;
  filings_deactivated: number;
  api_requests: number;
  error_message: string | null;
  details: Record<string, unknown> | null;
  triggered_rebuild: boolean;
}

interface UpcomingState {
  stateAbbr: string;
  primaryDate: string;
  daysUntil: number;
  filingsCount: number;
}

const DEFAULT_CONFIG: AutomationConfig = {
  fec_sync_enabled: true,
  lookahead_days: 60,
  lookback_days: 30,
  min_funds_raised: 5000,
  major_parties_only: true,
  active_only: true,
  vercel_deploy_hook: null,
  webhook_secret: null,
  last_sync_at: null,
};

export default function AutomationPage({ setHeaderActions }: AutomationPageProps) {
  const [config, setConfig] = useState<AutomationConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<Record<string, unknown> | null>(null);

  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);

  const [upcomingStates, setUpcomingStates] = useState<UpcomingState[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    setHeaderActions(null);
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  // Load config
  useEffect(() => {
    fetchConfig();
    fetchLogs();
  }, []);

  // Recalculate upcoming states when config changes
  useEffect(() => {
    if (!loading) fetchUpcomingStates();
  }, [config.lookahead_days, config.lookback_days, loading]);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("automation_config")
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      if (data) setConfig(data);
    } catch (err) {
      console.warn("Could not load automation config:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (page = 1) => {
    setLogsLoading(true);
    try {
      const pageSize = 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("sync_logs")
        .select("*", { count: "exact" })
        .order("started_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setSyncLogs(data ?? []);
      setLogTotal(count ?? 0);
      setLogPage(page);
    } catch (err) {
      console.warn("Could not load sync logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchUpcomingStates = useCallback(async () => {
    setStatesLoading(true);
    try {
      const { data: cycle } = await supabase
        .from("election_cycles")
        .select("id")
        .eq("is_active", true)
        .single();
      if (!cycle) return;

      const now = new Date();
      const lookback = new Date(now);
      lookback.setDate(lookback.getDate() - (config.lookback_days ?? 30));
      const lookahead = new Date(now);
      lookahead.setDate(lookahead.getDate() + (config.lookahead_days ?? 60));

      const { data: events } = await supabase
        .from("calendar_events")
        .select("state_id, event_date, state:states!inner(abbr)")
        .eq("cycle_id", cycle.id)
        .eq("event_type", "primary")
        .gte("event_date", lookback.toISOString().split("T")[0])
        .lte("event_date", lookahead.toISOString().split("T")[0])
        .order("event_date");

      if (!events) {
        setUpcomingStates([]);
        return;
      }

      // Get filing counts per state
      const { data: filingCounts } = await supabase
        .from("fec_filings")
        .select("state_id")
        .eq("cycle_id", cycle.id)
        .eq("is_active", true);

      const countByState = new Map<number, number>();
      for (const f of filingCounts ?? []) {
        countByState.set(f.state_id, (countByState.get(f.state_id) ?? 0) + 1);
      }

      const states: UpcomingState[] = events.map((e: any) => {
        const abbr = (e.state as { abbr: string }).abbr;
        const eventDate = new Date(e.event_date + "T00:00:00");
        const daysUntil = Math.ceil(
          (eventDate.getTime() - now.getTime()) / 86_400_000,
        );
        return {
          stateAbbr: abbr,
          primaryDate: e.event_date,
          daysUntil,
          filingsCount: countByState.get(e.state_id) ?? 0,
        };
      });

      setUpcomingStates(states);
    } catch (err) {
      console.warn("Could not load upcoming states:", err);
    } finally {
      setStatesLoading(false);
    }
  }, [config.lookahead_days, config.lookback_days]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("automation_config")
        .update({
          fec_sync_enabled: config.fec_sync_enabled,
          lookahead_days: config.lookahead_days,
          lookback_days: config.lookback_days,
          min_funds_raised: config.min_funds_raised,
          major_parties_only: config.major_parties_only,
          active_only: config.active_only,
          vercel_deploy_hook: config.vercel_deploy_hook || null,
          webhook_secret: config.webhook_secret || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      if (error) throw error;
      messageApi.success("Configuration saved");
    } catch (err) {
      messageApi.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncNow = async () => {
    if (!config.webhook_secret) {
      messageApi.warning("Set a webhook secret first");
      return;
    }

    Modal.confirm({
      title: "Trigger Manual Sync?",
      content: (
        <div>
          <p>This will sync FEC data for {upcomingStates.length} state(s) with upcoming primaries:</p>
          <p style={{ fontWeight: 600 }}>{upcomingStates.map((s) => s.stateAbbr).join(", ") || "None in window"}</p>
          <p>The sync runs against your live database.</p>
        </div>
      ),
      okText: "Sync Now",
      onOk: executeSync,
    });
  };

  const executeSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
      const url = `${supabaseUrl}/functions/v1/fec-sync`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.webhook_secret}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      setSyncResult(data);
      if (data.status === "success" || data.status === "partial") {
        messageApi.success(`Sync complete: ${data.created ?? 0} created, ${data.updated ?? 0} updated`);
      } else {
        messageApi.warning(`Sync had issues: ${data.error || "Check logs"}`);
      }
      fetchLogs();
      fetchConfig();
      fetchUpcomingStates();
    } catch (err: any) {
      messageApi.error(`Sync failed: ${err.message}`);
      setSyncResult({ error: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    messageApi.success("Copied to clipboard");
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/fec-sync${config.webhook_secret ? `?secret=${config.webhook_secret}` : ""}`;

  return (
    <div>
      {contextHolder}

      {/* Overview */}
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message="FEC Auto-Sync"
        description="Automatically syncs FEC candidate data for states with upcoming primaries. Configure below, then set up a daily cron job at cronjob.org to call the Edge Function."
        style={{ marginBottom: 20 }}
      />

      {/* Status bar */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Status"
              value={config.fec_sync_enabled ? "Enabled" : "Disabled"}
              valueStyle={{ color: config.fec_sync_enabled ? "#52c41a" : "#ff4d4f", fontSize: 16 }}
              prefix={config.fec_sync_enabled ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Last Sync"
              value={config.last_sync_at ? new Date(config.last_sync_at).toLocaleDateString() : "Never"}
              valueStyle={{ fontSize: 16 }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="States in Window"
              value={upcomingStates.length}
              valueStyle={{ fontSize: 16 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Syncs"
              value={logTotal}
              valueStyle={{ fontSize: 16 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Configuration */}
      <Card
        title={<Space><RobotOutlined /><span>Configuration</span></Space>}
        size="small"
        style={{ marginBottom: 16 }}
        extra={
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
            Save
          </Button>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ marginBottom: 12 }}>
              <Text strong>Auto-Sync Enabled</Text>
              <div style={{ marginTop: 4 }}>
                <Switch
                  checked={config.fec_sync_enabled}
                  onChange={(checked) => setConfig({ ...config, fec_sync_enabled: checked })}
                />
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  {config.fec_sync_enabled ? "Cron will sync data" : "Cron calls will be ignored"}
                </Text>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Text strong>Lookahead Window</Text>
              <Tooltip title="Sync states whose primary is within this many days from now">
                <InfoCircleOutlined style={{ marginLeft: 4, color: "#999" }} />
              </Tooltip>
              <div style={{ marginTop: 4 }}>
                <InputNumber
                  min={7}
                  max={180}
                  value={config.lookahead_days}
                  onChange={(val) => setConfig({ ...config, lookahead_days: val ?? 60 })}
                  addonAfter="days ahead"
                  style={{ width: 200 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Text strong>Lookback Window</Text>
              <Tooltip title="Also sync states whose primary happened within this many days ago (catches late filings)">
                <InfoCircleOutlined style={{ marginLeft: 4, color: "#999" }} />
              </Tooltip>
              <div style={{ marginTop: 4 }}>
                <InputNumber
                  min={0}
                  max={90}
                  value={config.lookback_days}
                  onChange={(val) => setConfig({ ...config, lookback_days: val ?? 30 })}
                  addonAfter="days back"
                  style={{ width: 200 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Text strong>Minimum Funds Raised</Text>
              <div style={{ marginTop: 4 }}>
                <InputNumber
                  min={0}
                  max={1000000}
                  step={1000}
                  value={config.min_funds_raised}
                  onChange={(val) => setConfig({ ...config, min_funds_raised: val ?? 5000 })}
                  formatter={(val) => `$ ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  style={{ width: 200 }}
                />
              </div>
            </div>
          </div>

          <div>
            <div style={{ marginBottom: 12 }}>
              <Text strong>Filters</Text>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                <Checkbox
                  checked={config.major_parties_only}
                  onChange={(e) => setConfig({ ...config, major_parties_only: e.target.checked })}
                >
                  Major parties only (D, R, I)
                </Checkbox>
                <Checkbox
                  checked={config.active_only}
                  onChange={(e) => setConfig({ ...config, active_only: e.target.checked })}
                >
                  Active candidates only
                </Checkbox>
              </div>
            </div>

            <Divider style={{ margin: "12px 0" }} />

            <div style={{ marginBottom: 12 }}>
              <Text strong>Vercel Deploy Hook</Text>
              <Tooltip title="After a successful sync, this URL is called to rebuild your site">
                <InfoCircleOutlined style={{ marginLeft: 4, color: "#999" }} />
              </Tooltip>
              <div style={{ marginTop: 4 }}>
                <Input.Password
                  placeholder="https://api.vercel.com/v1/integrations/deploy/..."
                  value={config.vercel_deploy_hook ?? ""}
                  onChange={(e) => setConfig({ ...config, vercel_deploy_hook: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Text strong>Webhook Secret</Text>
              <Tooltip title="Shared secret for authenticating cron requests. Must match WEBHOOK_SECRET in Supabase Edge Function secrets.">
                <InfoCircleOutlined style={{ marginLeft: 4, color: "#999" }} />
              </Tooltip>
              <div style={{ marginTop: 4 }}>
                <Input.Password
                  placeholder="A random string shared with cronjob.org"
                  value={config.webhook_secret ?? ""}
                  onChange={(e) => setConfig({ ...config, webhook_secret: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cron setup instructions */}
        <Alert
          type="warning"
          message="Cron Setup (cronjob.org)"
          description={
            <div>
              <p style={{ margin: "4px 0" }}>Configure a daily POST request at cronjob.org:</p>
              <div style={{ background: "#f5f5f5", padding: 8, borderRadius: 4, fontFamily: "monospace", fontSize: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ wordBreak: "break-all" }}>URL: {edgeFunctionUrl}</span>
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(edgeFunctionUrl)}
                  />
                </div>
                <div>Method: POST</div>
                {!config.webhook_secret && <div style={{ color: "#faad14" }}>⚠ Set webhook secret above to generate the full URL</div>}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Recommended schedule: Daily at 6:00 AM UTC (after FEC nightly data refresh)
              </Text>
            </div>
          }
          style={{ marginTop: 8 }}
        />
      </Card>

      {/* Next Sync Preview */}
      <Card
        title={<Space><SyncOutlined /><span>Next Sync Preview</span></Space>}
        size="small"
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={fetchUpcomingStates} loading={statesLoading}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleSyncNow}
              loading={syncing}
              disabled={upcomingStates.length === 0}
            >
              Sync Now
            </Button>
          </Space>
        }
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 12, fontSize: 13 }}>
          These states fall within the configured window ({config.lookback_days}d back, {config.lookahead_days}d ahead) and will be synced on the next run.
        </Text>

        {statesLoading ? (
          <Spin />
        ) : upcomingStates.length === 0 ? (
          <Text type="secondary">No states with primaries in the current window. Adjust lookahead/lookback days above.</Text>
        ) : (
          <Table
            dataSource={upcomingStates}
            rowKey="stateAbbr"
            size="small"
            pagination={false}
            columns={[
              { title: "State", dataIndex: "stateAbbr", key: "state", width: 70 },
              {
                title: "Primary Date",
                dataIndex: "primaryDate",
                key: "date",
                render: (d: string) =>
                  new Date(d + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }),
              },
              {
                title: "Days",
                dataIndex: "daysUntil",
                key: "days",
                width: 80,
                render: (d: number) => {
                  if (d < 0) return <Tag color="default">{Math.abs(d)}d ago</Tag>;
                  if (d <= 14) return <Tag color="red">{d}d</Tag>;
                  if (d <= 30) return <Tag color="orange">{d}d</Tag>;
                  return <Tag color="green">{d}d</Tag>;
                },
              },
              {
                title: "Current Filings",
                dataIndex: "filingsCount",
                key: "filings",
                width: 120,
              },
            ]}
          />
        )}

        {syncResult && (
          <Alert
            type={syncResult.status === "success" ? "success" : syncResult.status === "partial" ? "warning" : "error"}
            message={`Sync result: ${syncResult.status}`}
            description={
              <pre style={{ fontSize: 11, maxHeight: 200, overflow: "auto", margin: 0 }}>
                {JSON.stringify(syncResult, null, 2)}
              </pre>
            }
            closable
            onClose={() => setSyncResult(null)}
            style={{ marginTop: 12 }}
          />
        )}
      </Card>

      {/* Sync History */}
      <Card
        title={<Space><ClockCircleOutlined /><span>Sync History</span></Space>}
        size="small"
      >
        <Table
          dataSource={syncLogs}
          rowKey="id"
          size="small"
          loading={logsLoading}
          pagination={{
            current: logPage,
            total: logTotal,
            pageSize: 20,
            onChange: (page) => fetchLogs(page),
            showTotal: (total) => `${total} syncs`,
          }}
          expandable={{
            expandedRowRender: (record: SyncLog) => (
              <div style={{ padding: "8px 0" }}>
                {record.error_message && (
                  <Alert
                    type="warning"
                    message="Errors"
                    description={record.error_message}
                    style={{ marginBottom: 8, fontSize: 12 }}
                  />
                )}
                {record.details && (
                  <pre style={{ fontSize: 11, background: "#f5f5f5", padding: 8, borderRadius: 4, maxHeight: 200, overflow: "auto" }}>
                    {JSON.stringify(record.details, null, 2)}
                  </pre>
                )}
              </div>
            ),
          }}
          columns={[
            {
              title: "Date",
              dataIndex: "started_at",
              key: "date",
              width: 140,
              render: (d: string) =>
                new Date(d).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }),
            },
            {
              title: "Type",
              dataIndex: "sync_type",
              key: "type",
              width: 90,
              render: (t: string) => (
                <Tag>{t === "fec_auto" ? "Auto" : "Manual"}</Tag>
              ),
            },
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              width: 90,
              render: (s: string) => {
                const colors: Record<string, string> = {
                  success: "green",
                  partial: "orange",
                  error: "red",
                  running: "blue",
                };
                return <Tag color={colors[s] ?? "default"}>{s}</Tag>;
              },
            },
            {
              title: "States",
              dataIndex: "states_synced",
              key: "states",
              render: (states: string[] | null) =>
                states?.length ? (
                  <Text style={{ fontSize: 12 }}>{states.join(", ")}</Text>
                ) : (
                  <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
                ),
            },
            {
              title: "Created",
              dataIndex: "filings_created",
              key: "created",
              width: 70,
              render: (n: number) => n > 0 ? <Text style={{ color: "#52c41a" }}>{n}</Text> : <Text type="secondary">0</Text>,
            },
            {
              title: "Updated",
              dataIndex: "filings_updated",
              key: "updated",
              width: 70,
              render: (n: number) => n > 0 ? <Text style={{ color: "#1890ff" }}>{n}</Text> : <Text type="secondary">0</Text>,
            },
            {
              title: "Deactivated",
              dataIndex: "filings_deactivated",
              key: "deactivated",
              width: 90,
              render: (n: number) => n > 0 ? <Text style={{ color: "#ff4d4f" }}>{n}</Text> : <Text type="secondary">0</Text>,
            },
            {
              title: "API",
              dataIndex: "api_requests",
              key: "api",
              width: 60,
            },
            {
              title: "Rebuild",
              dataIndex: "triggered_rebuild",
              key: "rebuild",
              width: 70,
              render: (b: boolean) => b ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>,
            },
            {
              title: "Duration",
              key: "duration",
              width: 80,
              render: (_: unknown, record: SyncLog) => {
                if (!record.completed_at) return <Tag color="blue">Running</Tag>;
                const ms = new Date(record.completed_at).getTime() - new Date(record.started_at).getTime();
                const secs = Math.round(ms / 1000);
                return <Text type="secondary" style={{ fontSize: 12 }}>{secs}s</Text>;
              },
            },
          ]}
        />
      </Card>
    </div>
  );
}
