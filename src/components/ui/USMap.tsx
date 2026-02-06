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
}

function BallotPanel({
  stateInfo,
  senateRace,
  isMobile,
  isOpen,
  onClose,
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

  const accentColor = senateRace
    ? RATING_COLORS[senateRace.rating] ?? NEUTRAL_COLOR
    : NEUTRAL_COLOR;

  return (
    <div
      className={`
        fixed z-[55] bg-white shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto
        ${isMobile
          ? "inset-x-0 bottom-0 rounded-t-2xl max-h-[70vh]"
          : "top-0 right-0 bottom-0 w-[400px] border-l border-slate-200"
        }
        ${isOpen
          ? "translate-x-0 translate-y-0"
          : isMobile
            ? "translate-y-full"
            : "translate-x-full"
        }
      `}
    >
      {/* Accent bar */}
      <div
        className="absolute top-0 left-0 bottom-0 w-1"
        style={{ backgroundColor: accentColor }}
      />

      {/* Mobile drag handle */}
      {isMobile && (
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
      )}

      <div className="p-5 pl-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-navy">
              {stateInfo.name}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Here's what you'll vote on in November 2026
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 -mt-1"
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

        {/* Ballot items — visual ballot style */}
        <div className="space-y-3">
          {/* Senate */}
          <BallotItem
            icon="🏛"
            title="U.S. Senate"
            hasElection={!!senateRace || !!stateInfo.senateClass2Senator}
          >
            {senateRace ? (
              <CompetitiveRaceCard race={senateRace} />
            ) : stateInfo.senateClass2Senator ? (
              <div className="text-sm text-slate-600 mt-2">
                <p>
                  Sen. <span className="font-semibold">{stateInfo.senateClass2Senator}</span>{" "}
                  ({stateInfo.senateClass2Party}) is up for re-election.
                  This race is not expected to be close.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 mt-2">
                Your state doesn't have a Senate seat up for election in 2026.
              </p>
            )}
          </BallotItem>

          {/* House */}
          <BallotItem icon="🏠" title="U.S. House" hasElection={true}>
            <div className="text-sm text-slate-600 mt-2">
              {stateInfo.houseDistricts === 1 ? (
                <p>
                  You'll pick <span className="font-semibold">1 representative</span> who
                  serves your entire state.
                </p>
              ) : (
                <p>
                  Your state has <span className="font-semibold">{stateInfo.houseDistricts} districts</span>.
                  You'll pick the representative for your district.
                </p>
              )}
            </div>
          </BallotItem>

          {/* Governor */}
          <BallotItem
            icon="⭐"
            title="Governor"
            hasElection={!!stateInfo.governorUpIn2026}
          >
            {stateInfo.governorUpIn2026 ? (
              <div className="text-sm mt-2">
                {stateInfo.currentGovernor && (
                  <p className="text-slate-500">
                    Current: Gov. {stateInfo.currentGovernor} ({stateInfo.currentGovernorParty})
                  </p>
                )}
                <p className="mt-1 text-tossup font-medium text-xs">
                  Candidate details coming soon
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 mt-2">
                Your state isn't electing a governor in 2026.
              </p>
            )}
          </BallotItem>

          {/* Ballot Measures */}
          <BallotItem icon="📋" title="Statewide Questions" hasElection={null}>
            <p className="text-sm text-slate-400 mt-2">
              These are yes-or-no votes on new laws or policy changes.
              Details for your state are coming soon.
            </p>
          </BallotItem>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-slate-300 mt-5 text-center">
          For educational purposes only. Senate race ratings from nonpartisan analysts.
        </p>
      </div>
    </div>
  );
}

// --- Ballot Item — visual ballot-style row ---

function BallotItem({
  icon,
  title,
  hasElection,
  children,
}: {
  icon: string;
  title: string;
  hasElection: boolean | null; // null = unknown/coming soon
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <h3 className="font-bold text-navy text-sm flex-1">{title}</h3>
        {hasElection === true && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-navy text-white px-2 py-0.5 rounded">
            On your ballot
          </span>
        )}
        {hasElection === false && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-400 px-2 py-0.5 rounded">
            Not this year
          </span>
        )}
        {hasElection === null && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-tossup/10 text-tossup px-2 py-0.5 rounded">
            Researching
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// --- Competitive Race Card ---

function CompetitiveRaceCard({ race }: { race: SenateRace }) {
  const ratingColor = RATING_COLORS[race.rating] ?? NEUTRAL_COLOR;

  return (
    <div className="mt-2">
      {/* Rating + badges */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="inline-block text-white text-xs font-bold px-2.5 py-0.5 rounded-full"
          style={{ backgroundColor: ratingColor }}
        >
          {race.rating}
        </span>
        {race.isSpecialElection && (
          <span className="inline-block bg-ind-light text-ind-dark text-xs font-bold px-2.5 py-0.5 rounded-full">
            Special Election
          </span>
        )}
        {race.isOpenSeat && (
          <span className="inline-block bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Open Seat
          </span>
        )}
      </div>

      {/* Candidates */}
      <div className="space-y-2">
        {[
          ...race.candidates.democrat.map((c) => ({ ...c, party: "Democrat" as const })),
          ...race.candidates.republican.map((c) => ({ ...c, party: "Republican" as const })),
          ...(race.candidates.independent ?? []).map((c) => ({ ...c, party: "Independent" as const })),
        ].map((candidate) => {
          const colors = PARTY_COLORS[candidate.party]!;
          return (
            <div
              key={candidate.id}
              className={`${colors.bg} rounded-lg p-3`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                <span className={`font-semibold text-sm ${colors.text}`}>
                  {candidate.name}
                </span>
                {candidate.isIncumbent && (
                  <span className="text-[10px] bg-white/60 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                    Incumbent
                  </span>
                )}
              </div>
              {candidate.keyIssues.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5 ml-4">
                  {candidate.keyIssues.slice(0, 3).map((issue) => (
                    <span
                      key={issue}
                      className="text-[10px] bg-white/50 text-slate-500 px-1.5 py-0.5 rounded"
                    >
                      {issue}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Why this race matters */}
      {race.whyCompetitive && (
        <p className="text-xs text-slate-500 mt-3 italic leading-relaxed">
          {race.whyCompetitive}
        </p>
      )}
    </div>
  );
}
