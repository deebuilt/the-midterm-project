import { useState, useEffect, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "@vnedyalk0v/react19-simple-maps";
import type { StateInfo, SenateRace } from "../../types";

// --- Types ---

interface USMapProps {
  states: StateInfo[];
  senateRaces: SenateRace[];
  statesByFips: Record<string, StateInfo>;
}

// --- Ballot selections (localStorage) ---

type BallotSelections = Record<string, Record<string, string>>;
// shape: { "CA": { "senate": "candidate-id", "governor": "candidate-id" }, ... }

const STORAGE_KEY = "tmp-ballot-selections";

function loadSelections(): BallotSelections {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSelections(selections: BallotSelections): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

// --- Color mapping ---

const RATING_COLORS: Record<string, string> = {
  "Safe D": "#1E40AF",
  "Likely D": "#3B82F6",
  "Lean D": "#93C5FD",
  "Toss-up": "#F59E0B",
  "Lean R": "#FCA5A5",
  "Likely R": "#EF4444",
  "Safe R": "#991B1B",
};

const NEUTRAL_COLOR = "#CBD5E1";

function getStateFill(
  abbr: string,
  racesByAbbr: Record<string, SenateRace>
): string {
  const race = racesByAbbr[abbr];
  if (!race) return NEUTRAL_COLOR;
  return RATING_COLORS[race.rating] ?? NEUTRAL_COLOR;
}

const PARTY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Democrat: { bg: "bg-dem-light", text: "text-dem-dark", dot: "bg-dem" },
  Republican: { bg: "bg-gop-light", text: "text-gop-dark", dot: "bg-gop" },
  Independent: { bg: "bg-ind-light", text: "text-ind-dark", dot: "bg-ind" },
};

// --- Main Component ---

export default function USMap({ states, senateRaces, statesByFips }: USMapProps) {
  const [selectedAbbr, setSelectedAbbr] = useState<string | null>(null);
  const [hoveredAbbr, setHoveredAbbr] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [topoData, setTopoData] = useState<any>(null);
  const [ballotSelections, setBallotSelections] = useState<BallotSelections>({});

  // Load saved selections on mount
  useEffect(() => {
    setBallotSelections(loadSelections());
  }, []);

  const handleBallotSelect = useCallback(
    (stateAbbr: string, office: string, candidateId: string) => {
      setBallotSelections((prev) => {
        const stateSelections = prev[stateAbbr] ?? {};
        const isDeselect = stateSelections[office] === candidateId;

        let newStateSelections: Record<string, string>;
        if (isDeselect) {
          const { [office]: _, ...rest } = stateSelections;
          newStateSelections = rest;
        } else {
          newStateSelections = { ...stateSelections, [office]: candidateId };
        }

        // Clean up empty state objects
        if (Object.keys(newStateSelections).length === 0) {
          const { [stateAbbr]: _, ...rest } = prev;
          saveSelections(rest);
          return rest;
        }

        const updated = { ...prev, [stateAbbr]: newStateSelections };
        saveSelections(updated);
        return updated;
      });
    },
    []
  );

  useEffect(() => {
    fetch("/data/states-10m.json")
      .then((res) => res.json())
      .then((data) => setTopoData(data))
      .catch((err) => console.error("Failed to load map data:", err));
  }, []);

  const statesByAbbrMap = Object.fromEntries(states.map((s) => [s.abbr, s]));
  const racesByAbbr = Object.fromEntries(
    senateRaces.map((r) => [r.stateAbbr, r])
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!selectedAbbr) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedAbbr(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedAbbr]);

  useEffect(() => {
    if (!selectedAbbr || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedAbbr, isMobile]);

  const handleStateClick = useCallback(
    (fips: string) => {
      const state = statesByFips[fips];
      if (state) setSelectedAbbr(state.abbr);
    },
    [statesByFips]
  );

  const selectedState = selectedAbbr ? statesByAbbrMap[selectedAbbr] : null;
  const selectedRace = selectedAbbr ? racesByAbbr[selectedAbbr] : undefined;

  if (!topoData) {
    return (
      <div className="relative">
        <div className="w-full flex items-center justify-center py-24 text-slate-400">
          Loading map...
        </div>
        <MapLegend />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Map */}
      <div className="w-full">
        <ComposableMap
          projection="geoAlbersUsa"
          width={800}
          height={500}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={topoData}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any, index: number) => {
                const fips = geo.id;
                const stateInfo = statesByFips[fips];
                const abbr = stateInfo?.abbr ?? "";
                const fill = getStateFill(abbr, racesByAbbr);
                const isSelected = abbr === selectedAbbr;

                return (
                  <Geography
                    key={geo.rsmKey ?? geo.id ?? index}
                    geography={geo}
                    fill={isSelected ? "#1E293B" : fill}
                    stroke="#FFFFFF"
                    strokeWidth={isSelected ? 1.5 : 0.5}
                    onClick={() => handleStateClick(fips)}
                    onTouchEnd={(e: any) => {
                      e.preventDefault();
                      handleStateClick(fips);
                    }}
                    onMouseEnter={(e: any) => {
                      if (!selectedAbbr) {
                        setHoveredAbbr(abbr);
                        setTooltipPos({ x: e.clientX, y: e.clientY });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredAbbr(null);
                      setTooltipPos(null);
                    }}
                    style={{
                      default: {
                        outline: "none",
                        cursor: "pointer",
                        transition: "fill 0.15s",
                        WebkitTapHighlightColor: "transparent",
                      },
                      hover: {
                        outline: "none",
                        cursor: "pointer",
                        filter: "brightness(0.85)",
                      },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Tooltip — only when no panel is open */}
      {!isMobile && !selectedAbbr && hoveredAbbr && tooltipPos && statesByAbbrMap[hoveredAbbr] && (
        <div
          className="fixed z-[60] bg-navy text-white text-xs font-medium px-2.5 py-1 rounded pointer-events-none shadow-lg"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 32 }}
        >
          {statesByAbbrMap[hoveredAbbr]!.name}
        </div>
      )}

      {/* Legend */}
      <MapLegend />

      {/* Backdrop (mobile) */}
      {selectedAbbr && isMobile && (
        <div
          className="fixed inset-0 z-[54] bg-black/30"
          onClick={() => setSelectedAbbr(null)}
        />
      )}

      {/* Ballot Panel */}
      <BallotPanel
        stateInfo={selectedState}
        senateRace={selectedRace}
        isMobile={isMobile}
        isOpen={!!selectedAbbr}
        onClose={() => setSelectedAbbr(null)}
        selections={selectedAbbr ? (ballotSelections[selectedAbbr] ?? {}) : {}}
        onSelect={selectedAbbr ? (office, candidateId) => handleBallotSelect(selectedAbbr, office, candidateId) : () => {}}
      />
    </div>
  );
}

// --- Legend ---

function MapLegend() {
  const items = [
    { label: "Safe D", color: RATING_COLORS["Safe D"]! },
    { label: "Likely D", color: RATING_COLORS["Likely D"]! },
    { label: "Lean D", color: RATING_COLORS["Lean D"]! },
    { label: "Toss-up", color: RATING_COLORS["Toss-up"]! },
    { label: "Lean R", color: RATING_COLORS["Lean R"]! },
    { label: "Likely R", color: RATING_COLORS["Likely R"]! },
    { label: "Safe R", color: RATING_COLORS["Safe R"]! },
    { label: "Not competitive", color: NEUTRAL_COLOR },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-600 mt-4 mb-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// --- Ballot Panel ---

interface BallotPanelProps {
  stateInfo: StateInfo | null;
  senateRace: SenateRace | undefined;
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
  selections: Record<string, string>;
  onSelect: (office: string, candidateId: string) => void;
}

function BallotPanel({
  stateInfo,
  senateRace,
  isMobile,
  isOpen,
  onClose,
  selections,
  onSelect,
}: BallotPanelProps) {
  if (!stateInfo) {
    return (
      <div
        className={`
          fixed z-[55] bg-white shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto
          ${isMobile
            ? "inset-x-0 bottom-0 rounded-t-2xl max-h-[70vh]"
            : "top-0 right-0 bottom-0 w-[400px] border-l border-slate-200"
          }
          ${isMobile ? "translate-y-full" : "translate-x-full"}
        `}
      />
    );
  }

  const hasSenateRace = !!senateRace || !!stateInfo.senateClass2Senator;

  return (
    <div
      className={`
        fixed z-[55] bg-[#FFFEF8] shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto
        ${isMobile
          ? "inset-x-0 bottom-0 rounded-t-2xl max-h-[75vh]"
          : "top-0 right-0 bottom-0 w-[420px] border-l border-slate-300"
        }
        ${isOpen
          ? "translate-x-0 translate-y-0"
          : isMobile
            ? "translate-y-full"
            : "translate-x-full"
        }
      `}
    >
      {/* Mobile drag handle */}
      {isMobile && (
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
      )}

      {/* Ballot header — black bar like a real ballot */}
      <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-wide">
            {stateInfo.name}
          </h2>
          <p className="text-[11px] text-white/70 tracking-wide">
            Ballot Preview — General Election, November 2026
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors p-1 -mr-1"
          aria-label="Close panel"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="px-4 py-3">
        <p className="text-xs text-slate-500 mb-3 italic">
          Tap a candidate to mark your pick. Your selections are saved on this device only.
        </p>

        {/* ── FEDERAL OFFICES ── */}
        <BallotSectionHeader title="Federal Offices" />

        {/* Senate */}
        <BallotRow
          office="United States Senator"
          status={hasSenateRace ? "on-ballot" : "not-this-year"}
        >
          {senateRace ? (
            <CompetitiveRaceCard
              race={senateRace}
              selectedId={selections["senate"]}
              onSelect={(candidateId) => onSelect("senate", candidateId)}
            />
          ) : stateInfo.senateClass2Senator ? (
            <div className="px-3 py-2">
              <BallotBubble
                name={stateInfo.senateClass2Senator}
                party={stateInfo.senateClass2Party ?? "Republican"}
                detail="Incumbent — running for re-election"
                candidateId={`incumbent-${stateInfo.abbr}-senate`}
                isSelected={selections["senate"] === `incumbent-${stateInfo.abbr}-senate`}
                onSelect={(id) => onSelect("senate", id)}
              />
              <EmptyBallotBubble
                party={stateInfo.senateClass2Party === "Democrat" ? "Republican" : "Democrat"}
              />
              <p className="text-[11px] text-slate-400 mt-2 pl-7">
                This race isn't expected to be close, but you'll still see it on your ballot.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 px-3 py-2">
              No Senate seat up in your state this year.
            </p>
          )}
        </BallotRow>

        {/* House */}
        <BallotRow office="United States Representative" status="on-ballot">
          <div className="px-3 py-2 text-xs text-slate-600">
            {stateInfo.houseDistricts === 1 ? (
              <p>
                {stateInfo.name} has <span className="font-semibold">1 at-large seat</span> —
                {" "}one representative for the whole state. You'll vote for this seat.
              </p>
            ) : (
              <p>
                {stateInfo.name} has <span className="font-semibold">{stateInfo.houseDistricts} congressional districts</span>.
                {" "}You vote only in your district — find yours at{" "}
                <a
                  href="https://www.house.gov/representatives/find-your-representative"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-dem"
                >
                  house.gov
                </a>.
              </p>
            )}
          </div>
        </BallotRow>

        {/* ── STATE OFFICES ── */}
        <BallotSectionHeader title="State Offices" />

        {/* Governor */}
        <BallotRow
          office="Governor"
          status={stateInfo.governorUpIn2026 ? "on-ballot" : "not-this-year"}
        >
          {stateInfo.governorUpIn2026 ? (
            <div className="px-3 py-2">
              {stateInfo.currentGovernor && (() => {
                // Check if current governor is running for Senate instead
                const govRunningForSenate = senateRace?.candidates.democrat.some(
                  c => c.name === stateInfo.currentGovernor
                ) || senateRace?.candidates.republican.some(
                  c => c.name === stateInfo.currentGovernor
                );
                const govId = `gov-${stateInfo.abbr}`;
                return govRunningForSenate ? (
                  <p className="text-[11px] text-slate-500 mb-1">
                    Gov. {stateInfo.currentGovernor} is running for U.S. Senate, so this seat will be open.
                  </p>
                ) : (
                  <BallotBubble
                    name={`Gov. ${stateInfo.currentGovernor}`}
                    party={stateInfo.currentGovernorParty ?? "Republican"}
                    detail="Current governor"
                    candidateId={govId}
                    isSelected={selections["governor"] === govId}
                    onSelect={(id) => onSelect("governor", id)}
                  />
                );
              })()}
              <EmptyBallotBubble party="Democrat" />
              <EmptyBallotBubble party="Republican" />
              <p className="text-[11px] text-tossup mt-2 pl-7">
                Candidate details coming soon
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 px-3 py-2">
              Not up for election in 2026.
            </p>
          )}
        </BallotRow>

        {/* ── BALLOT MEASURES ── */}
        <BallotSectionHeader title="Ballot Measures" />

        <BallotRow office="Statewide Ballot Measures" status="unknown">
          <div className="px-3 py-2">
            <p className="text-xs text-slate-500">
              Ballot measures are yes-or-no votes on new laws, constitutional amendments,
              or policy changes. They go directly to voters instead of through the legislature.
            </p>
            <p className="text-[11px] text-tossup mt-1.5">
              Details for {stateInfo.name} coming soon
            </p>
          </div>
        </BallotRow>

        {/* Footer */}
        <div className="border-t-2 border-black mt-4 pt-3">
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            For educational purposes only. Not an official ballot.
            Race ratings from nonpartisan analysts (Cook Political Report, Sabato's Crystal Ball).
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Ballot section header — black bar ---

function BallotSectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-black text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 mt-3 first:mt-0">
      {title}
    </div>
  );
}

// --- Ballot row — one office ---

function BallotRow({
  office,
  status,
  children,
}: {
  office: string;
  status: "on-ballot" | "not-this-year" | "unknown";
  children: React.ReactNode;
}) {
  return (
    <div className="border-x border-b border-slate-300">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 border-b border-slate-200">
        <span className="text-xs font-bold text-slate-700">{office}</span>
        {status === "on-ballot" && (
          <span className="text-[9px] font-bold uppercase tracking-wider bg-black text-white px-1.5 py-0.5">
            Vote for one
          </span>
        )}
        {status === "not-this-year" && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Not this year
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// --- Ballot bubble — candidate row with oval marker ---

function BallotBubble({
  name,
  party,
  detail,
  isIncumbent,
  website,
  candidateId,
  isSelected,
  onSelect,
}: {
  name: string;
  party: string;
  detail?: string;
  isIncumbent?: boolean;
  website?: string;
  candidateId?: string;
  isSelected?: boolean;
  onSelect?: (candidateId: string) => void;
}) {
  const partyAbbr =
    party === "Democrat" ? "DEM" : party === "Republican" ? "REP" : "IND";
  const partyBorderColor =
    party === "Democrat"
      ? "border-dem"
      : party === "Republican"
        ? "border-gop"
        : "border-ind";
  const partyFillColor =
    party === "Democrat"
      ? "bg-dem"
      : party === "Republican"
        ? "bg-gop"
        : "bg-ind";

  const canSelect = !!candidateId && !!onSelect;

  return (
    <div
      className={`flex items-start gap-2 py-1 ${canSelect ? "cursor-pointer group/bubble" : ""}`}
      onClick={canSelect ? () => onSelect(candidateId) : undefined}
      role={canSelect ? "radio" : undefined}
      aria-checked={canSelect ? isSelected : undefined}
      tabIndex={canSelect ? 0 : undefined}
      onKeyDown={canSelect ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(candidateId); } } : undefined}
    >
      <span
        className={`mt-0.5 w-4 h-3 rounded-[50%] border-2 ${partyBorderColor} flex-shrink-0 transition-all duration-150 ${
          isSelected ? `${partyFillColor} scale-110 shadow-sm` : canSelect ? "group-hover/bubble:scale-105" : ""
        }`}
      />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-semibold underline decoration-1 underline-offset-2 hover:decoration-2 ${isSelected ? "text-slate-900" : "text-slate-800"}`}
              onClick={(e) => e.stopPropagation()}
            >
              {name}
            </a>
          ) : (
            <span className={`text-sm font-semibold ${isSelected ? "text-slate-900" : "text-slate-800"}`}>{name}</span>
          )}
          <span className="text-[10px] text-slate-400 font-medium">{partyAbbr}</span>
          {isIncumbent && (
            <span className="text-[9px] bg-slate-200 text-slate-500 px-1 py-0.5 rounded font-medium">
              Incumbent
            </span>
          )}
          {isSelected && (
            <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded font-bold tracking-wide">
              YOUR PICK
            </span>
          )}
        </div>
        {detail && (
          <p className="text-[11px] text-slate-400 leading-snug">{detail}</p>
        )}
      </div>
    </div>
  );
}

// --- Empty ballot bubble — placeholder for unannounced candidates ---

function EmptyBallotBubble({ party }: { party: string }) {
  const partyAbbr =
    party === "Democrat" ? "DEM" : party === "Republican" ? "REP" : "IND";
  const partyDot =
    party === "Democrat"
      ? "border-dem"
      : party === "Republican"
        ? "border-gop"
        : "border-ind";

  return (
    <div className="flex items-start gap-2 py-1 opacity-40">
      <span
        className={`mt-0.5 w-4 h-3 rounded-[50%] border-2 border-dashed ${partyDot} flex-shrink-0`}
      />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-slate-400 italic">No announced candidate</span>
          <span className="text-[10px] text-slate-300 font-medium">{partyAbbr}</span>
        </div>
      </div>
    </div>
  );
}

// --- Competitive Race Card ---

function CompetitiveRaceCard({
  race,
  selectedId,
  onSelect,
}: {
  race: SenateRace;
  selectedId?: string;
  onSelect?: (candidateId: string) => void;
}) {
  const ratingColor = RATING_COLORS[race.rating] ?? NEUTRAL_COLOR;

  const allCandidates = [
    ...race.candidates.democrat.map((c) => ({ ...c, party: "Democrat" as const })),
    ...race.candidates.republican.map((c) => ({ ...c, party: "Republican" as const })),
    ...(race.candidates.independent ?? []).map((c) => ({ ...c, party: "Independent" as const })),
  ];

  return (
    <div className="px-3 py-2">
      {/* Rating badges */}
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className="text-white text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: ratingColor }}
        >
          {race.rating}
        </span>
        {race.isSpecialElection && (
          <span className="bg-ind-light text-ind-dark text-[10px] font-bold px-2 py-0.5 rounded">
            Special Election
          </span>
        )}
        {race.isOpenSeat && (
          <span className="bg-slate-200 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded">
            Open Seat
          </span>
        )}
      </div>

      {/* Candidate bubbles */}
      <div className="space-y-0.5" role="radiogroup" aria-label="Select a candidate">
        {allCandidates.map((candidate) => (
          <BallotBubble
            key={candidate.id}
            name={candidate.name}
            party={candidate.party}
            detail={candidate.currentRole}
            isIncumbent={candidate.isIncumbent}
            website={candidate.website}
            candidateId={candidate.id}
            isSelected={selectedId === candidate.id}
            onSelect={onSelect}
          />
        ))}
        {race.candidates.democrat.length === 0 && (
          <EmptyBallotBubble party="Democrat" />
        )}
        {race.candidates.republican.length === 0 && (
          <EmptyBallotBubble party="Republican" />
        )}
      </div>

      {/* Why this race matters */}
      {race.whyCompetitive && (
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed border-t border-dashed border-slate-200 pt-2">
          {race.whyCompetitive}
        </p>
      )}
    </div>
  );
}
