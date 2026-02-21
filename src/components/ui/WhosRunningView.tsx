import { useState, useMemo, useEffect, useCallback } from "react";
import type { RacesByState, RaceWithCandidates, RaceCandidateInfo, RaceRating, VotingRecord } from "../../types";

interface WhosRunningViewProps {
  racesByState: RacesByState[];
}

interface CandidateSheetData {
  candidate: RaceCandidateInfo;
  state: string;
  stateAbbr: string;
  body: "Senate" | "House" | "Governor";
  district: number | null;
  rating: RaceRating | null;
  memberTitle: string;
  isSpecialElection: boolean;
  isOpenSeat: boolean;
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

function VoteBadge({ vote }: { vote: VotingRecord["vote"] }) {
  const styles: Record<string, string> = {
    yea: "bg-green-100 text-green-700",
    nay: "bg-red-100 text-red-700",
    abstain: "bg-gray-100 text-gray-600",
    not_voting: "bg-slate-100 text-slate-500",
  };
  const labels: Record<string, string> = {
    yea: "YEA",
    nay: "NAY",
    abstain: "ABSTAIN",
    not_voting: "NOT VOTING",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${styles[vote] ?? ""}`}>
      {labels[vote] ?? vote}
    </span>
  );
}

function ExternalLinkIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function CandidateRow({ candidate, maxRaised, onViewProfile }: { candidate: RaceCandidateInfo; maxRaised: number; onViewProfile: () => void }) {
  const colors = PARTY_COLORS[candidate.party] ?? PARTY_COLORS.Other;
  const raised = candidate.fundsRaised ?? 0;
  const barWidth = maxRaised > 0 ? (raised / maxRaised) * 100 : 0;
  const status = statusBadge(candidate.status);
  const fecUrl = candidate.fecCandidateId
    ? `https://www.fec.gov/data/candidate/${candidate.fecCandidateId}/`
    : null;
  const linkUrl = candidate.website ?? fecUrl;

  return (
    <div
      className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
      role="button"
      tabIndex={0}
      onClick={onViewProfile}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onViewProfile(); } }}
    >
      {/* Name + party + badges */}
      <div className="w-48 sm:w-56 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {linkUrl ? (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sm text-slate-800 hover:underline"
              onClick={(e) => e.stopPropagation()}
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

      {/* Info chevron */}
      <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

function RaceSection({ race, onViewProfile }: { race: RaceWithCandidates; onViewProfile: (data: CandidateSheetData) => void }) {
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
          <CandidateRow
            key={c.id}
            candidate={c}
            maxRaised={maxRaised}
            onViewProfile={() => onViewProfile({
              candidate: c,
              state: race.state,
              stateAbbr: race.stateAbbr,
              body: race.body,
              district: race.district,
              rating: race.rating,
              memberTitle: race.memberTitle,
              isSpecialElection: race.isSpecialElection,
              isOpenSeat: race.isOpenSeat,
            })}
          />
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
  onViewProfile,
}: {
  group: RacesByState;
  isOpen: boolean;
  onToggle: () => void;
  bodyFilter: "all" | "Senate" | "House";
  onViewProfile: (data: CandidateSheetData) => void;
}) {
  const races = bodyFilter === "all"
    ? group.races
    : group.races.filter((r) => r.body === bodyFilter);

  const totalCandidates = races.reduce((sum, r) => sum + r.candidates.length, 0);
  const bodies = bodyFilter === "all"
    ? [...new Set(group.races.map((r) => r.body))].sort()
    : null;
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
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm text-slate-500">
                {primaryFormatted ? `Primary: ${primaryFormatted}` : "Primary: TBD"}
                <span className="text-slate-300 mx-1.5">&middot;</span>
                {races.length} race{races.length !== 1 ? "s" : ""},{" "}
                {totalCandidates} candidate{totalCandidates !== 1 ? "s" : ""}
              </p>
              {bodies && bodies.map((b) => (
                <span
                  key={b}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    b === "Senate" ? "bg-indigo-100 text-indigo-700" : "bg-sky-100 text-sky-700"
                  }`}
                >
                  {b}
                </span>
              ))}
            </div>
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
          {bodyFilter === "all" ? (
            <>
              {(() => {
                const senateRaces = races.filter((r) => r.body === "Senate");
                const houseRaces = races.filter((r) => r.body === "House");
                return (
                  <>
                    {senateRaces.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Senate</h4>
                        {senateRaces.map((race) => (
                          <RaceSection key={race.raceId} race={race} onViewProfile={onViewProfile} />
                        ))}
                      </div>
                    )}
                    {senateRaces.length > 0 && houseRaces.length > 0 && (
                      <div className="border-t border-slate-200 my-4" />
                    )}
                    {houseRaces.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-2">House</h4>
                        {houseRaces.map((race) => (
                          <RaceSection key={race.raceId} race={race} onViewProfile={onViewProfile} />
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          ) : (
            races.map((race) => (
              <RaceSection key={race.raceId} race={race} onViewProfile={onViewProfile} />
            ))
          )}
          <p className="text-[11px] text-slate-400 mt-2">
            Source: FEC. Fundraising totals may not reflect the latest filings.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Candidate Detail Bottom Sheet ───

const SHEET_PARTY_COLORS: Record<string, string> = {
  Democrat: "bg-blue-100 text-blue-700",
  Republican: "bg-red-100 text-red-700",
  Independent: "bg-purple-100 text-purple-700",
  Libertarian: "bg-amber-100 text-amber-700",
  Green: "bg-emerald-100 text-emerald-700",
  Other: "bg-slate-100 text-slate-600",
};

function CandidateDetailSheet({
  data,
  isOpen,
  onClose,
}: {
  data: CandidateSheetData | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  const c = data?.candidate;

  // Build subtitle: "California · U.S. Representative · District 4" or "Texas · U.S. Senator"
  const subtitle = data
    ? [
        data.state,
        data.memberTitle,
        data.body === "House" && data.district ? `District ${data.district}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  // Initials fallback for photo
  const initials = c
    ? c.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[54] bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`
          fixed inset-x-0 bottom-0 z-[55] bg-white rounded-t-2xl shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-y-0" : "translate-y-full"}
        `}
        style={{ maxHeight: "70vh" }}
        role="dialog"
        aria-modal="true"
        aria-label={c ? `Details for ${c.name}` : undefined}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {c && data && (
          <div className="overflow-y-auto px-5 pb-6" style={{ maxHeight: "calc(70vh - 20px)" }}>
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              {/* Photo or initials */}
              {c.photo ? (
                <img
                  src={c.photo}
                  alt={c.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm flex-shrink-0">
                  {initials}
                </div>
              )}

              <div className="flex-1 min-w-0">
                {c.website ? (
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-bold text-slate-900 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    {c.name}
                    <ExternalLinkIcon className="w-4 h-4 shrink-0" />
                  </a>
                ) : (
                  <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                )}
                <p className="text-sm text-slate-500">
                  {subtitle}
                  {c.isIncumbent && c.termStartYear && (
                    <span className="text-slate-400">
                      {" "}· Since {c.termStartYear} ({new Date().getFullYear() - c.termStartYear} yrs)
                    </span>
                  )}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0 ml-2"
                aria-label="Close details"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${SHEET_PARTY_COLORS[c.party] ?? SHEET_PARTY_COLORS.Other}`}>
                {c.party}
              </span>
              {data.rating && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${RATING_COLORS[data.rating] ?? "bg-slate-100 text-slate-600"}`}>
                  {data.rating}
                </span>
              )}
              {c.isIncumbent ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Incumbent
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Challenger
                </span>
              )}
              {c.isRetiring && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  Retiring
                </span>
              )}
              {data.isSpecialElection && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  Special Election
                </span>
              )}
            </div>

            {/* External links */}
            {(c.twitter || c.govtrackUrl) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {c.twitter && (
                  <a
                    href={`https://x.com/${c.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center gap-1"
                  >
                    @{c.twitter}
                    <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                )}
                {c.govtrackUrl && (
                  <a
                    href={c.govtrackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center gap-1"
                  >
                    GovTrack Profile
                    <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Bio */}
            {c.bio && (
              <p className="text-sm text-slate-500 italic mb-4 leading-relaxed">
                {c.bio}
              </p>
            )}

            {/* Fundraising snapshot */}
            {(c.fundsRaised != null || c.fundsSpent != null || c.cashOnHand != null) && (
              <div className="bg-slate-50 rounded-lg px-3 py-2 mb-4">
                <div className="flex items-center gap-4 text-sm">
                  {c.fundsRaised != null && (
                    <div>
                      <span className="text-slate-400 text-xs">Raised</span>
                      <p className="font-semibold text-slate-700">{formatMoney(c.fundsRaised)}</p>
                    </div>
                  )}
                  {c.fundsSpent != null && (
                    <div>
                      <span className="text-slate-400 text-xs">Spent</span>
                      <p className="font-semibold text-slate-700">{formatMoney(c.fundsSpent)}</p>
                    </div>
                  )}
                  {c.cashOnHand != null && (
                    <div>
                      <span className="text-slate-400 text-xs">Cash on Hand</span>
                      <p className="font-semibold text-slate-700">{formatMoney(c.cashOnHand)}</p>
                    </div>
                  )}
                </div>
                {c.fecCandidateId && (
                  <a
                    href={`https://www.fec.gov/data/candidate/${c.fecCandidateId}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-slate-400 hover:text-blue-600 underline decoration-1 underline-offset-2 inline-flex items-center gap-1 mt-1"
                  >
                    View on FEC.gov
                    <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Vote Pattern Summary */}
            {c.votes.length > 0 && (() => {
              const yeas = c.votes.filter(v => v.vote === "yea").length;
              const nays = c.votes.filter(v => v.vote === "nay").length;
              const others = c.votes.length - yeas - nays;
              return (
                <div className="flex items-center gap-3 mb-4 bg-slate-50 rounded-lg px-3 py-2 text-sm">
                  <span className="text-green-700 font-semibold">Yea {yeas}/{c.votes.length}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-red-700 font-semibold">Nay {nays}/{c.votes.length}</span>
                  {others > 0 && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500 font-medium">Other {others}</span>
                    </>
                  )}
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden flex">
                    <div className="bg-green-500 h-full" style={{ width: `${(yeas / c.votes.length) * 100}%` }} />
                    <div className="bg-red-500 h-full" style={{ width: `${(nays / c.votes.length) * 100}%` }} />
                  </div>
                </div>
              );
            })()}

            {/* Voting Records */}
            {c.votes.length > 0 ? (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">
                  How They Voted ({c.votes.length})
                  {c.govtrackUrl && (
                    <>
                      {" · "}
                      <a
                        href={c.govtrackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-normal text-slate-400 hover:text-blue-700 underline decoration-1 underline-offset-2 inline-flex items-center gap-1"
                      >
                        view key votes
                        <ExternalLinkIcon className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </h4>
                <div className="space-y-2.5">
                  {c.votes.map((v) => (
                    <div key={v.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-slate-800 leading-tight">
                          {v.sourceUrl ? (
                            <a
                              href={v.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-700 underline decoration-1 underline-offset-2 inline-flex items-center gap-1"
                            >
                              {v.billName}
                              <ExternalLinkIcon className="w-3 h-3 shrink-0 inline" />
                            </a>
                          ) : (
                            v.billName
                          )}
                          {v.billNumber && (
                            <span className="text-slate-400 font-normal ml-1">({v.billNumber})</span>
                          )}
                        </div>
                        <VoteBadge vote={v.vote} />
                      </div>
                      {v.summary && (
                        <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{v.summary}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        {v.result && <span className="font-medium">{v.result}</span>}
                        {v.topic && <span>{v.topic}</span>}
                        {v.voteDate && <span>{new Date(v.voteDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : c.govtrackUrl ? (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">How They Voted</h4>
                <p className="text-sm text-slate-400">
                  No voting records here yet.{" "}
                  <a
                    href={c.govtrackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-blue-700 underline decoration-1 underline-offset-2 inline-flex items-center gap-1"
                  >
                    View key votes on GovTrack
                    <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">
                No voting records available yet.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function WhosRunningView({ racesByState }: WhosRunningViewProps) {
  const [bodyFilter, setBodyFilter] = useState<"all" | "Senate" | "House">("all");
  const [stateFilter, setStateFilter] = useState("");
  const [sortBy, setSortBy] = useState<"primary" | "state" | "candidates">("primary");
  const [openStates, setOpenStates] = useState<Set<string>>(new Set());
  const [sheetData, setSheetData] = useState<CandidateSheetData | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleViewProfile = useCallback((data: CandidateSheetData) => {
    setSheetData(data);
    setIsSheetOpen(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setIsSheetOpen(false);
  }, []);

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
            onViewProfile={handleViewProfile}
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

      {/* Candidate Detail Bottom Sheet */}
      <CandidateDetailSheet
        data={sheetData}
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
      />
    </div>
  );
}
