import { useState, useMemo, useEffect } from "react";
import type { RacesByState, RaceWithCandidates, RaceCandidateInfo } from "../../types";

interface WhosRunningViewProps {
  racesByState: RacesByState[];
}

const PARTY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Democrat: { bg: "bg-dem-light", text: "text-dem", bar: "bg-dem" },
  Republican: { bg: "bg-gop-light", text: "text-gop", bar: "bg-gop" },
  Independent: { bg: "bg-ind-light", text: "text-ind", bar: "bg-ind" },
  Libertarian: { bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500" },
  Green: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
  Other: { bg: "bg-slate-100", text: "text-slate-600", bar: "bg-slate-400" },
};

const RATING_COLORS: Record<string, string> = {
  "Safe D": "bg-dem/20 text-dem",
  "Likely D": "bg-dem/15 text-dem",
  "Lean D": "bg-dem/10 text-dem",
  "Toss-up": "bg-tossup-light text-tossup",
  "Lean R": "bg-gop/10 text-gop",
  "Likely R": "bg-gop/15 text-gop",
  "Safe R": "bg-gop/20 text-gop",
};

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

function urgencyBadge(days: number | null) {
  if (days === null) return null;
  if (days < 0) return { label: "Primary passed", color: "bg-slate-200 text-slate-600" };
  if (days <= 14) return { label: `${days}d away`, color: "bg-red-100 text-red-700" };
  if (days <= 30) return { label: `${days}d away`, color: "bg-amber-100 text-amber-700" };
  if (days <= 60) return { label: `${days}d away`, color: "bg-emerald-100 text-emerald-700" };
  return { label: `${days}d away`, color: "bg-slate-100 text-slate-600" };
}

function statusBadge(status: string) {
  switch (status) {
    case "primary_winner":
      return { label: "Primary Winner", className: "bg-emerald-100 text-emerald-700" };
    case "withdrawn":
      return { label: "Withdrawn", className: "bg-slate-200 text-slate-500" };
    case "won":
      return { label: "Won", className: "bg-emerald-100 text-emerald-700" };
    case "lost":
      return { label: "Lost", className: "bg-red-100 text-red-600" };
    case "runoff":
      return { label: "Runoff", className: "bg-amber-100 text-amber-700" };
    default:
      return null;
  }
}

function CandidateRow({ candidate, maxRaised }: { candidate: RaceCandidateInfo; maxRaised: number }) {
  const colors = PARTY_COLORS[candidate.party] ?? PARTY_COLORS.Other;
  const raised = candidate.fundsRaised ?? 0;
  const barWidth = maxRaised > 0 ? (raised / maxRaised) * 100 : 0;
  const status = statusBadge(candidate.status);
  const fecUrl = candidate.fecCandidateId
    ? `https://www.fec.gov/data/candidate/${candidate.fecCandidateId}/`
    : null;
  const linkUrl = candidate.website ?? fecUrl;

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Name + party + badges */}
      <div className="w-48 sm:w-56 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {linkUrl ? (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sm text-slate-800 hover:underline"
            >
              {candidate.name}
            </a>
          ) : (
            <span className="font-medium text-sm text-slate-800">{candidate.name}</span>
          )}
          {candidate.isIncumbent && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
              Incumbent
            </span>
          )}
          {status && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${status.className}`}>
              {status.label}
            </span>
          )}
        </div>
        <span className={`text-xs ${colors.text}`}>
          {candidate.party === "Democrat" ? "D" : candidate.party === "Republican" ? "R" : candidate.party.charAt(0)}
        </span>
      </div>

      {/* Fundraising bar + details */}
      <div className="flex-1 min-w-0">
        {raised > 0 ? (
          <>
            <div className="relative h-6 bg-slate-100 rounded overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 ${colors.bar} transition-all duration-500 rounded`}
                style={{ width: `${Math.max(barWidth, 1)}%` }}
              />
              <span className="absolute right-2 top-0 h-full flex items-center text-xs font-semibold text-slate-700">
                {formatMoney(raised)}
              </span>
            </div>
            <div className="flex gap-3 mt-0.5">
              {candidate.fundsSpent != null && (
                <span className="text-[11px] text-slate-400">Spent: {formatMoney(candidate.fundsSpent)}</span>
              )}
              {candidate.cashOnHand != null && (
                <span className="text-[11px] text-slate-400">Cash: {formatMoney(candidate.cashOnHand)}</span>
              )}
            </div>
          </>
        ) : (
          <span className="text-[11px] text-slate-400">No fundraising data</span>
        )}
      </div>
    </div>
  );
}

function RaceSection({ race }: { race: RaceWithCandidates }) {
  const maxRaised = Math.max(...race.candidates.map((c) => c.fundsRaised ?? 0), 1);
  const ratingColor = race.rating ? RATING_COLORS[race.rating] ?? "bg-slate-100 text-slate-600" : null;

  const searchTerm = race.body === "House"
    ? `${race.state} congressional district ${race.district}`
    : `${race.state} ${race.body.toLowerCase()} election 2026`;

  return (
    <div className="mb-5 last:mb-0">
      {/* Race header */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="font-semibold text-sm text-slate-700">
          {race.body === "House" ? `District ${race.district}` : race.body}
        </span>
        {ratingColor && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ratingColor}`}>
            {race.rating}
          </span>
        )}
        {race.isOpenSeat && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
            Open Seat
          </span>
        )}
        {race.isSpecialElection && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
            Special
          </span>
        )}
        <a
          href={`https://ballotpedia.org/Special:Search?search=${encodeURIComponent(searchTerm)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-[11px] text-slate-400 hover:text-navy underline"
        >
          Research on Ballotpedia
        </a>
      </div>

      {/* Candidates */}
      <div className="divide-y divide-slate-100">
        {race.candidates.map((c) => (
          <CandidateRow key={c.id} candidate={c} maxRaised={maxRaised} />
        ))}
      </div>
    </div>
  );
}

function StateCard({
  group,
  isOpen,
  onToggle,
  bodyFilter,
}: {
  group: RacesByState;
  isOpen: boolean;
  onToggle: () => void;
  bodyFilter: "all" | "Senate" | "House";
}) {
  const races = bodyFilter === "all"
    ? group.races
    : group.races.filter((r) => r.body === bodyFilter);

  const totalCandidates = races.reduce((sum, r) => sum + r.candidates.length, 0);
  const badge = urgencyBadge(group.daysUntilPrimary);
  const primaryFormatted = group.primaryDate
    ? new Date(group.primaryDate + "T00:00:00").toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  if (races.length === 0) return null;

  return (
    <div className="border border-slate-200 rounded-xl mb-3 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <svg
            className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div>
            <h3 className="text-lg font-bold text-navy">{group.stateName}</h3>
            <p className="text-sm text-slate-500">
              {primaryFormatted ? `Primary: ${primaryFormatted}` : "Primary: TBD"}
              <span className="text-slate-300 mx-1.5">&middot;</span>
              {races.length} race{races.length !== 1 ? "s" : ""},{" "}
              {totalCandidates} candidate{totalCandidates !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {badge && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${badge.color}`}>
            {badge.label}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-4 border-t border-slate-100 pt-3">
          {races.map((race) => (
            <RaceSection key={race.raceId} race={race} />
          ))}
          <p className="text-[11px] text-slate-400 mt-2">
            Source: FEC. Fundraising totals may not reflect the latest filings.
          </p>
        </div>
      )}
    </div>
  );
}

export default function WhosRunningView({ racesByState }: WhosRunningViewProps) {
  const [bodyFilter, setBodyFilter] = useState<"all" | "Senate" | "House">("all");
  const [stateFilter, setStateFilter] = useState("");
  const [sortBy, setSortBy] = useState<"primary" | "state" | "candidates">("primary");
  const [openStates, setOpenStates] = useState<Set<string>>(new Set());

  // Read hash on mount to set initial body filter
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash === "house") setBodyFilter("House");
    else if (hash === "senate") setBodyFilter("Senate");
  }, []);

  // Update hash when filter changes
  useEffect(() => {
    if (bodyFilter !== "all") {
      window.location.hash = bodyFilter.toLowerCase();
    } else {
      // Clear hash without scrolling
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [bodyFilter]);

  // Check which bodies are available
  const availableBodies = useMemo(() => {
    const bodies = new Set<string>();
    for (const g of racesByState) {
      for (const r of g.races) bodies.add(r.body);
    }
    return bodies;
  }, [racesByState]);

  const stateOptions = useMemo(
    () =>
      racesByState
        .map((g) => ({ abbr: g.stateAbbr, name: g.stateName }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [racesByState]
  );

  const filtered = useMemo(() => {
    let result = racesByState;
    if (stateFilter) {
      result = result.filter((g) => g.stateAbbr === stateFilter);
    }
    if (sortBy === "state") {
      result = [...result].sort((a, b) => a.stateName.localeCompare(b.stateName));
    } else if (sortBy === "candidates") {
      result = [...result].sort((a, b) => {
        const aCandidates = a.races.reduce((s, r) => s + r.candidates.length, 0);
        const bCandidates = b.races.reduce((s, r) => s + r.candidates.length, 0);
        return bCandidates - aCandidates;
      });
    }
    return result;
  }, [racesByState, stateFilter, sortBy]);

  const totalCandidates = filtered.reduce(
    (sum, g) => sum + g.races.reduce((s, r) => s + r.candidates.length, 0),
    0
  );

  function toggleState(abbr: string) {
    setOpenStates((prev) => {
      const next = new Set(prev);
      if (next.has(abbr)) next.delete(abbr);
      else next.add(abbr);
      return next;
    });
  }

  function expandAll() {
    setOpenStates(new Set(filtered.map((g) => g.stateAbbr)));
  }

  function collapseAll() {
    setOpenStates(new Set());
  }

  return (
    <div>
      {/* Body tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setBodyFilter("all")}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
            bodyFilter === "all"
              ? "border-navy text-navy"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          All
        </button>
        {availableBodies.has("Senate") && (
          <button
            onClick={() => setBodyFilter("Senate")}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
              bodyFilter === "Senate"
                ? "border-navy text-navy"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Senate
          </button>
        )}
        {availableBodies.has("House") && (
          <button
            onClick={() => setBodyFilter("House")}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
              bodyFilter === "House"
                ? "border-navy text-navy"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            House
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
        >
          <option value="">All States ({stateOptions.length})</option>
          {stateOptions.map((s) => (
            <option key={s.abbr} value={s.abbr}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
        >
          <option value="primary">Sort by Primary Date</option>
          <option value="state">Sort by State Name</option>
          <option value="candidates">Sort by Most Candidates</option>
        </select>

        <span className="text-sm text-slate-500">
          {totalCandidates} candidate{totalCandidates !== 1 ? "s" : ""} across{" "}
          {filtered.length} state{filtered.length !== 1 ? "s" : ""}
        </span>

        <div className="ml-auto flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors underline"
          >
            Expand all
          </button>
          <button
            onClick={collapseAll}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors underline"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* State cards */}
      {filtered.length > 0 ? (
        filtered.map((group) => (
          <StateCard
            key={group.stateAbbr}
            group={group}
            isOpen={openStates.has(group.stateAbbr)}
            onToggle={() => toggleState(group.stateAbbr)}
            bodyFilter={bodyFilter}
          />
        ))
      ) : (
        <p className="text-center py-8 text-slate-400">
          No candidates found for the selected filter.
        </p>
      )}

      {/* Footer note */}
      <p className="text-xs text-slate-400 mt-6 text-center">
        Data from the Federal Election Commission (FEC).
        Fundraising totals are updated periodically and may not reflect the latest filings.
      </p>
    </div>
  );
}
