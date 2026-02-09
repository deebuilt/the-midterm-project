/**
 * OpenFEC API client.
 *
 * Wraps the api.open.fec.gov endpoints we need to pull
 * federal candidate data for Senate and House races.
 *
 * Rate limit: 1,000 requests/hour per API key.
 * Data updated nightly by the FEC.
 */

const BASE_URL = "https://api.open.fec.gov/v1";

// ─── Types ───

export interface FecCandidate {
  candidate_id: string;        // e.g. "S8CA00502"
  name: string;                // "FEINSTEIN, DIANNE" (FEC uses LAST, FIRST format)
  party_full: string;          // "DEMOCRATIC PARTY"
  party: string;               // "DEM"
  state: string;               // "CA"
  office: "S" | "H" | "P";    // Senate / House / President
  office_full: string;         // "Senate"
  district: string;            // "00" for Senate, "01"-"53" for House
  election_year: number;
  incumbent_challenge: "I" | "C" | "O";  // Incumbent / Challenger / Open
  incumbent_challenge_full: string;
  candidate_status: string;    // "C" = current/active
  has_raised_funds: boolean;
  federal_funds_flag: boolean;
  cycles: number[];
  active_through: number;
}

export interface FecCandidateTotals {
  candidate_id: string;
  cycle: number;
  receipts: number;
  disbursements: number;
  cash_on_hand_end_period: number;
  debts_owed_by_committee: number;
  individual_contributions: number;
  coverage_start_date: string | null;
  coverage_end_date: string | null;
}

interface FecPaginatedResponse<T> {
  results: T[];
  pagination: {
    page: number;
    per_page: number;
    count: number;
    pages: number;
  };
}

// ─── Client ───

export class OpenFecClient {
  private apiKey: string;
  private requestCount = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(endpoint: string, params: Record<string, string | number | boolean> = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.set("api_key", this.apiKey);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    this.requestCount++;
    const response = await fetch(url.toString());

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenFEC API error ${response.status}: ${text}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Fetch all candidates for a given cycle and office type.
   * Handles pagination automatically.
   */
  async getCandidates(params: {
    cycle: number;
    office: "S" | "H";
    state?: string;
    district?: string;
    per_page?: number;
    is_active_candidate?: boolean;
    has_raised_funds?: boolean;
  }): Promise<FecCandidate[]> {
    const allResults: FecCandidate[] = [];
    let page = 1;
    const perPage = params.per_page ?? 100;

    while (true) {
      const queryParams: Record<string, string | number | boolean> = {
        cycle: params.cycle,
        office: params.office,
        per_page: perPage,
        page,
        sort: "name",
      };

      if (params.state) queryParams.state = params.state;
      if (params.district) queryParams.district = params.district;
      if (params.is_active_candidate !== undefined) queryParams.is_active_candidate = params.is_active_candidate;
      if (params.has_raised_funds !== undefined) queryParams.has_raised_funds = params.has_raised_funds;

      const data = await this.fetch<FecPaginatedResponse<FecCandidate>>("/candidates/", queryParams);
      allResults.push(...data.results);

      if (page >= data.pagination.pages) break;
      page++;
    }

    return allResults;
  }

  /**
   * Fetch a single candidate's details.
   */
  async getCandidate(candidateId: string): Promise<FecCandidate | null> {
    const data = await this.fetch<FecPaginatedResponse<FecCandidate>>(`/candidate/${candidateId}/`);
    return data.results[0] ?? null;
  }

  /**
   * Fetch financial totals for a candidate in a given cycle.
   */
  async getCandidateTotals(candidateId: string, cycle: number): Promise<FecCandidateTotals | null> {
    const data = await this.fetch<FecPaginatedResponse<FecCandidateTotals>>(
      `/candidate/${candidateId}/totals/`,
      { cycle }
    );
    return data.results[0] ?? null;
  }

  /**
   * Quick search to test API connectivity.
   * Returns the total count of Senate candidates for a cycle.
   */
  async testConnection(cycle: number = 2026): Promise<{ ok: boolean; count: number; error?: string }> {
    try {
      const data = await this.fetch<FecPaginatedResponse<FecCandidate>>("/candidates/", {
        cycle,
        office: "S",
        per_page: 1,
      });
      return { ok: true, count: data.pagination.count };
    } catch (err: any) {
      return { ok: false, count: 0, error: err.message };
    }
  }

  /** How many API calls have been made in this session */
  get requestsMade(): number {
    return this.requestCount;
  }
}

// ─── Helpers ───

/**
 * Parse FEC "LAST, FIRST MIDDLE" name format into first/last.
 * Examples:
 *   "FEINSTEIN, DIANNE" -> { first: "Dianne", last: "Feinstein" }
 *   "O'ROURKE, ROBERT BETO" -> { first: "Robert Beto", last: "O'Rourke" }
 *   "CRUZ, RAFAEL EDWARD \"TED\"" -> { first: "Rafael Edward \"Ted\"", last: "Cruz" }
 */
export function parseFecName(fecName: string | null | undefined): { first: string; last: string } {
  if (!fecName) return { first: "Unknown", last: "Unknown" };
  const commaIndex = fecName.indexOf(",");
  if (commaIndex === -1) {
    // No comma — just use the whole thing as last name
    return { first: "", last: titleCase(fecName) };
  }

  const rawLast = fecName.slice(0, commaIndex).trim();
  const rawFirst = fecName.slice(commaIndex + 1).trim();

  return {
    first: titleCase(rawFirst),
    last: titleCase(rawLast),
  };
}

/**
 * Map FEC party codes to our Party type.
 */
export function mapFecParty(fecParty: string | null | undefined): "Democrat" | "Republican" | "Independent" | "Libertarian" | "Green" | "Other" {
  if (!fecParty) return "Other";
  const normalized = fecParty.toUpperCase();
  if (normalized.includes("DEMOCRAT")) return "Democrat";
  if (normalized.includes("REPUBLICAN")) return "Republican";
  if (normalized.includes("LIBERTARIAN")) return "Libertarian";
  if (normalized.includes("GREEN")) return "Green";
  if (normalized.includes("INDEPENDENT") || normalized === "IND") return "Independent";
  // Map common third-party codes
  const codeMap: Record<string, "Democrat" | "Republican" | "Independent" | "Libertarian" | "Green" | "Other"> = {
    DEM: "Democrat",
    REP: "Republican",
    LIB: "Libertarian",
    GRE: "Green",
    IND: "Independent",
    NNE: "Independent", // No party/none
    NPA: "Independent", // No party affiliation
    UNK: "Other",
  };
  return codeMap[fecParty] ?? "Other";
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s|[-'/])\w/g, (match) => match.toUpperCase())
    // Fix common suffixes that get title-cased wrong
    .replace(/\bIi\b/g, "II")
    .replace(/\bIii\b/g, "III")
    .replace(/\bIv\b/g, "IV")
    .replace(/\bJr\b/g, "Jr")
    .replace(/\bSr\b/g, "Sr");
}

/**
 * Generate a slug from first + last name.
 */
export function slugifyName(first: string, last: string): string {
  return `${last}-${first}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
