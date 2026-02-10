/**
 * FEC Auto-Sync Edge Function
 *
 * Triggered daily by cronjob.org. Reads calendar_events to determine which
 * states have upcoming primaries, fetches FEC candidate data for those states,
 * upserts to fec_filings, deactivates dropouts, and triggers a Vercel rebuild.
 *
 * Secrets required:
 *   FEC_API_KEY      — OpenFEC API key
 *   WEBHOOK_SECRET   — shared secret for authenticating cron requests
 *
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-available.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FEC_BASE = "https://api.open.fec.gov/v1";
const CYCLE = 2026;

// ─── FEC API helpers ───

interface FecCandidate {
  candidate_id: string;
  name: string;
  party_full: string;
  party: string;
  state: string;
  office: "S" | "H" | "P";
  district: string;
  incumbent_challenge: "I" | "C" | "O";
  candidate_status: string;
  has_raised_funds: boolean;
}

interface FecTotals {
  receipts: number;
  disbursements: number;
  cash_on_hand_end_period: number;
}

interface FecPaginatedResponse<T> {
  results: T[];
  pagination: { page: number; per_page: number; count: number; pages: number };
}

let apiRequestCount = 0;

async function fecFetch<T>(
  apiKey: string,
  endpoint: string,
  params: Record<string, string | number | boolean> = {},
): Promise<T> {
  const url = new URL(`${FEC_BASE}${endpoint}`);
  url.searchParams.set("api_key", apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  apiRequestCount++;
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FEC API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function fetchFecCandidates(
  apiKey: string,
  params: {
    cycle: number;
    office: "S" | "H";
    state: string;
    is_active_candidate?: boolean;
    has_raised_funds?: boolean;
  },
): Promise<FecCandidate[]> {
  const all: FecCandidate[] = [];
  let page = 1;
  while (true) {
    const q: Record<string, string | number | boolean> = {
      cycle: params.cycle,
      office: params.office,
      state: params.state,
      per_page: 100,
      page,
      sort: "name",
    };
    if (params.is_active_candidate !== undefined)
      q.is_active_candidate = params.is_active_candidate;
    if (params.has_raised_funds !== undefined)
      q.has_raised_funds = params.has_raised_funds;

    const data = await fecFetch<FecPaginatedResponse<FecCandidate>>(
      apiKey,
      "/candidates/",
      q,
    );
    all.push(...data.results);
    if (page >= data.pagination.pages) break;
    page++;
  }
  return all;
}

async function fetchCandidateTotals(
  apiKey: string,
  candidateId: string,
  cycle: number,
): Promise<FecTotals | null> {
  const data = await fecFetch<FecPaginatedResponse<FecTotals>>(
    apiKey,
    `/candidate/${candidateId}/totals/`,
    { cycle },
  );
  return data.results[0] ?? null;
}

// ─── Name & party helpers (ported from src/lib/openfec.ts) ───

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s|[-'/])\w/g, (m) => m.toUpperCase())
    .replace(/\bIi\b/g, "II")
    .replace(/\bIii\b/g, "III")
    .replace(/\bIv\b/g, "IV")
    .replace(/\bJr\b/g, "Jr")
    .replace(/\bSr\b/g, "Sr");
}

function parseFecName(fecName: string | null | undefined): {
  first: string;
  last: string;
} {
  if (!fecName) return { first: "Unknown", last: "Unknown" };
  const commaIndex = fecName.indexOf(",");
  if (commaIndex === -1) return { first: "", last: titleCase(fecName) };
  return {
    first: titleCase(fecName.slice(commaIndex + 1).trim()),
    last: titleCase(fecName.slice(0, commaIndex).trim()),
  };
}

function mapFecParty(fecParty: string | null | undefined): string {
  if (!fecParty) return "Other";
  const n = fecParty.toUpperCase();
  if (n.includes("DEMOCRAT")) return "Democrat";
  if (n.includes("REPUBLICAN")) return "Republican";
  if (n.includes("LIBERTARIAN")) return "Libertarian";
  if (n.includes("GREEN")) return "Green";
  if (n.includes("INDEPENDENT") || n === "IND") return "Independent";
  const map: Record<string, string> = {
    DEM: "Democrat",
    REP: "Republican",
    LIB: "Libertarian",
    GRE: "Green",
    IND: "Independent",
    NNE: "Independent",
    NPA: "Independent",
  };
  return map[fecParty] ?? "Other";
}

// ─── Date helpers ───

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ─── Main handler ───

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-webhook-secret, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Auth check — use query param because Supabase gateway strips custom headers
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  const url = new URL(req.url);
  const providedSecret = url.searchParams.get("secret");
  if (!webhookSecret || providedSecret !== webhookSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const fecApiKey = Deno.env.get("FEC_API_KEY");
  if (!fecApiKey) {
    return Response.json({ error: "FEC_API_KEY not configured" }, { status: 500 });
  }

  // Init Supabase with service role (full access)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  apiRequestCount = 0;

  // Read config
  const { data: config } = await supabase
    .from("automation_config")
    .select("*")
    .eq("id", 1)
    .single();

  if (!config?.fec_sync_enabled) {
    return Response.json({ message: "FEC sync is disabled" });
  }

  // Create sync log (running)
  const { data: syncLog } = await supabase
    .from("sync_logs")
    .insert({ sync_type: "fec_auto", status: "running" })
    .select("id")
    .single();

  const syncLogId = syncLog?.id;

  try {
    // Get active cycle
    const { data: cycle } = await supabase
      .from("election_cycles")
      .select("id")
      .eq("is_active", true)
      .single();

    if (!cycle) throw new Error("No active election cycle");

    // Determine target states based on calendar_events
    const now = new Date();
    const lookbackDate = toDateString(addDays(now, -(config.lookback_days ?? 30)));
    const lookaheadDate = toDateString(addDays(now, config.lookahead_days ?? 60));

    const { data: upcomingPrimaries } = await supabase
      .from("calendar_events")
      .select("state_id, event_date, state:states!inner(abbr)")
      .eq("cycle_id", cycle.id)
      .eq("event_type", "primary")
      .gte("event_date", lookbackDate)
      .lte("event_date", lookaheadDate);

    if (!upcomingPrimaries || upcomingPrimaries.length === 0) {
      // No states in window — update log and return
      if (syncLogId) {
        await supabase
          .from("sync_logs")
          .update({
            status: "success",
            completed_at: new Date().toISOString(),
            states_synced: [],
            details: { message: "No states in sync window", lookbackDate, lookaheadDate },
          })
          .eq("id", syncLogId);
      }
      return Response.json({
        status: "success",
        message: "No states with primaries in the current window",
        window: { from: lookbackDate, to: lookaheadDate },
      });
    }

    const targetStates = upcomingPrimaries.map((e: any) => ({
      stateId: e.state_id,
      abbr: (e.state as { abbr: string }).abbr,
      primaryDate: e.event_date,
    }));

    // State ID lookup
    const { data: allStates } = await supabase.from("states").select("id, abbr");
    const stateAbbrToId = new Map<string, number>();
    for (const s of allStates ?? []) stateAbbrToId.set(s.abbr, s.id);

    const majorParties = new Set(["DEM", "REP", "IND", "NNE", "NPA"]);
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalDeactivated = 0;
    const statesSynced: string[] = [];
    const errors: string[] = [];

    for (const target of targetStates) {
      try {
        // Fetch FEC candidates for this state
        let candidates = await fetchFecCandidates(fecApiKey, {
          cycle: CYCLE,
          office: "S",
          state: target.abbr,
          is_active_candidate: config.active_only ?? true,
          has_raised_funds: true,
        });

        // Filter major parties
        if (config.major_parties_only) {
          candidates = candidates.filter(
            (c) => majorParties.has(c.party) || !c.party,
          );
        }

        // Deduplicate by candidate_id
        const seen = new Set<string>();
        candidates = candidates.filter((c) => {
          if (seen.has(c.candidate_id)) return false;
          seen.add(c.candidate_id);
          return true;
        });

        // Track which FEC IDs we see from the API for dropout detection
        const fecIdsFromApi = new Set<string>();

        for (const c of candidates) {
          fecIdsFromApi.add(c.candidate_id);

          // Fetch financial totals
          let totals: FecTotals | null = null;
          try {
            totals = await fetchCandidateTotals(fecApiKey, c.candidate_id, CYCLE);
          } catch {
            // Non-fatal — financials may not be available yet
          }

          const raised = totals?.receipts ?? 0;
          if (raised < (config.min_funds_raised ?? 5000)) continue;

          const { first, last } = parseFecName(c.name);
          const isActive = c.candidate_status === "C";

          const payload = {
            fec_candidate_id: c.candidate_id,
            cycle_id: cycle.id,
            state_id: target.stateId,
            name: c.name,
            first_name: first,
            last_name: last,
            party: mapFecParty(c.party_full),
            office: c.office as "S" | "H",
            district_number: c.office === "H" ? parseInt(c.district, 10) : null,
            is_incumbent: c.incumbent_challenge === "I",
            incumbent_challenge: c.incumbent_challenge,
            fec_candidate_status: c.candidate_status,
            is_active: isActive,
            funds_raised: raised,
            funds_spent: totals?.disbursements ?? 0,
            cash_on_hand: totals?.cash_on_hand_end_period ?? 0,
            last_synced_at: new Date().toISOString(),
            deactivated_at: !isActive ? new Date().toISOString() : null,
          };

          // Check if exists
          const { data: existing } = await supabase
            .from("fec_filings")
            .select("id")
            .eq("cycle_id", cycle.id)
            .eq("fec_candidate_id", c.candidate_id)
            .maybeSingle();

          const { error } = await supabase
            .from("fec_filings")
            .upsert(payload, { onConflict: "cycle_id,fec_candidate_id" });

          if (error) {
            errors.push(`${first} ${last} (${target.abbr}): ${error.message}`);
            continue;
          }

          if (existing) totalUpdated++;
          else totalCreated++;
        }

        // Deactivate candidates no longer returned by FEC for this state
        const { data: existingFilings } = await supabase
          .from("fec_filings")
          .select("id, fec_candidate_id")
          .eq("cycle_id", cycle.id)
          .eq("state_id", target.stateId)
          .eq("is_active", true)
          .is("promoted_to_candidate_id", null);

        for (const ef of existingFilings ?? []) {
          if (!fecIdsFromApi.has(ef.fec_candidate_id)) {
            await supabase
              .from("fec_filings")
              .update({
                is_active: false,
                deactivated_at: new Date().toISOString(),
              })
              .eq("id", ef.id);
            totalDeactivated++;
          }
        }

        statesSynced.push(target.abbr);
      } catch (err: any) {
        errors.push(`${target.abbr}: ${err.message}`);
      }
    }

    // Determine status
    const status =
      errors.length === 0
        ? "success"
        : statesSynced.length > 0
          ? "partial"
          : "error";

    // Update sync log
    if (syncLogId) {
      await supabase
        .from("sync_logs")
        .update({
          status,
          completed_at: new Date().toISOString(),
          states_synced: statesSynced,
          filings_created: totalCreated,
          filings_updated: totalUpdated,
          filings_deactivated: totalDeactivated,
          api_requests: apiRequestCount,
          error_message: errors.length > 0 ? errors.join("; ") : null,
          details: {
            target_states: targetStates.map((t: any) => t.abbr),
            window: { from: lookbackDate, to: lookaheadDate },
            config: {
              lookahead_days: config.lookahead_days,
              lookback_days: config.lookback_days,
              min_funds_raised: config.min_funds_raised,
              major_parties_only: config.major_parties_only,
              active_only: config.active_only,
            },
          },
        })
        .eq("id", syncLogId);
    }

    // Update last_sync_at
    await supabase
      .from("automation_config")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", 1);

    // Trigger Vercel rebuild if data changed
    let rebuildTriggered = false;
    if (
      (totalCreated > 0 || totalUpdated > 0 || totalDeactivated > 0) &&
      config.vercel_deploy_hook
    ) {
      try {
        await fetch(config.vercel_deploy_hook, { method: "POST" });
        rebuildTriggered = true;
        if (syncLogId) {
          await supabase
            .from("sync_logs")
            .update({ triggered_rebuild: true })
            .eq("id", syncLogId);
        }
      } catch {
        // Non-fatal — rebuild can be triggered manually
      }
    }

    return Response.json({
      status,
      statesSynced,
      created: totalCreated,
      updated: totalUpdated,
      deactivated: totalDeactivated,
      apiRequests: apiRequestCount,
      rebuildTriggered,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    // Fatal error
    if (syncLogId) {
      await supabase
        .from("sync_logs")
        .update({
          status: "error",
          completed_at: new Date().toISOString(),
          error_message: err.message,
          api_requests: apiRequestCount,
        })
        .eq("id", syncLogId);
    }
    return Response.json({ status: "error", error: err.message }, { status: 500 });
  }
});
