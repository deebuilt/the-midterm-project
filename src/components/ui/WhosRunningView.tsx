import { useState, useMemo } from "react";
import type { FilingsByState, FecFiling } from "../../types";

interface WhosRunningViewProps {
  filingsByState: FilingsByState[];
}

const PARTY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Democrat: { bg: "bg-dem-light", text: "text-dem", bar: "bg-dem" },
  Republican: { bg: "bg-gop-light", text: "text-gop", bar: "bg-gop" },
  Independent: { bg: "bg-ind-light", text: "text-ind", bar: "bg-ind" },
  Libertarian: { bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500" },
  Green: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
  Other: { bg: "bg-slate-100", text: "text-slate-600", bar: "bg-slate-400" },
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

function FilingRow({ filing, maxRaised }: { filing: FecFiling; maxRaised: number }) {
  const colors = PARTY_COLORS[filing.party] ?? PARTY_COLORS.Other;
  const barWidth = maxRaised > 0 ? (filing.fundsRaised / maxRaised) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-2 group">
      {/* Name + party */}
      <div className="w-48 sm:w-56 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-slate-800">
            {filing.firstName} {filing.lastName}
          </span>
          {filing.isIncumbent && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
              Incumbent
            </span>
          )}
        </div>
        <span className={`text-xs ${colors.text}`}>
          {filing.party === "Democrat" ? "D" : filing.party === "Republican" ? "R" : "I"}
        </span>
      </div>

      {/* Fundraising bar */}
      <div className="flex-1 min-w-0">
        <div className="relative h-6 bg-slate-100 rounded overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 ${colors.bar} transition-all duration-500 rounded`}
            style={{ width: `${Math.max(barWidth, 1)}%` }}
          />
          <span className="absolute right-2 top-0 h-full flex items-center text-xs font-semibold text-slate-700">
            {formatMoney(filing.fundsRaised)}
          </span>
        </div>
      </div>
    </div>
  );
}

function StateCard({
  group,
  isOpen,
  onToggle,
}: {
  group: FilingsByState;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const maxRaised = Math.max(...group.filings.map((f) => f.fundsRaised), 1);
  const badge = urgencyBadge(group.daysUntilPrimary);
  const primaryFormatted = group.primaryDate
    ? new Date(group.primaryDate + "T00:00:00").toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

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
              {group.filings.length} candidate{group.filings.length !== 1 ? "s" : ""}
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
        <div className="px-5 pb-4 border-t border-slate-100">
          <div className="divide-y divide-slate-100 pt-2">
            {group.filings.map((filing) => (
              <FilingRow key={filing.fecCandidateId} filing={filing} maxRaised={maxRaised} />
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Source: FEC
          </p>
        </div>
      )}
    </div>
  );
}

export default function WhosRunningView({ filingsByState }: WhosRunningViewProps) {
  const [stateFilter, setStateFilter] = useState("");
  const [sortBy, setSortBy] = useState<"primary" | "state" | "filings">("primary");
  const [openStates, setOpenStates] = useState<Set<string>>(new Set());

  const stateOptions = useMemo(
    () =>
      filingsByState
        .map((g) => ({ abbr: g.stateAbbr, name: g.stateName }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [filingsByState]
  );

  const filtered = useMemo(() => {
    let result = filingsByState;
    if (stateFilter) {
      result = result.filter((g) => g.stateAbbr === stateFilter);
    }
    if (sortBy === "state") {
      result = [...result].sort((a, b) => a.stateName.localeCompare(b.stateName));
    } else if (sortBy === "filings") {
      result = [...result].sort((a, b) => b.filings.length - a.filings.length);
    }
    // "primary" is the default sort from the query
    return result;
  }, [filingsByState, stateFilter, sortBy]);

  const totalFilings = filtered.reduce((sum, g) => sum + g.filings.length, 0);

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
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
        >
          <option value="">All States ({filingsByState.length})</option>
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
          <option value="filings">Sort by Most Candidates</option>
        </select>

        <span className="text-sm text-slate-500">
          {totalFilings} candidate{totalFilings !== 1 ? "s" : ""} across {filtered.length} state{filtered.length !== 1 ? "s" : ""}
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
          />
        ))
      ) : (
        <p className="text-center py-8 text-slate-400">
          No filings found for the selected filter.
        </p>
      )}

      {/* Footer note */}
      <p className="text-xs text-slate-400 mt-6 text-center">
        Data from the Federal Election Commission (FEC). Only candidates who have raised at least $5,000 are shown.
        Fundraising totals are updated periodically and may not reflect the latest filings.
      </p>
    </div>
  );
}
