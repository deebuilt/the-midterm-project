import { useState, useEffect, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "@vnedyalk0v/react19-simple-maps";
import type { StateInfo, SenateRace, BallotMeasure } from "../../types";

// --- Types ---

interface USMapProps {
  states: StateInfo[];
  senateRaces: SenateRace[];
  statesByFips: Record<string, StateInfo>;
  ballotMeasures?: Record<string, BallotMeasure[]>;
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

export default function USMap({ states, senateRaces, statesByFips, ballotMeasures }: USMapProps) {
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

  // Open ballot for state if ?state=XX param is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get("state")?.toUpperCase();
    if (stateParam && statesByAbbrMap[stateParam]) {
      setSelectedAbbr(stateParam);
    }
  }, []);

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
        stateMeasures={selectedAbbr && ballotMeasures ? (ballotMeasures[selectedAbbr] ?? []) : []}
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
  stateMeasures: BallotMeasure[];
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
  selections: Record<string, string>;
  onSelect: (office: string, candidateId: string) => void;
}

function BallotPanel({
  stateInfo,
  senateRace,
  stateMeasures,
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

  const hasSenateRace = !!senateRace || stateInfo.hasSenateRace;

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
          Plan your vote — tap a party to mark your pick, then research candidates using the links below.
          Selections are saved on this device only.
        </p>

        {/* ── FEDERAL OFFICES ── */}
        <BallotSectionHeader title="Federal Offices" />

        {/* Senate */}
        <BallotRow
          office="United States Senator"
          status={hasSenateRace ? "on-ballot" : "not-this-year"}
        >
          {senateRace ? (
            <SenatePreviewCard
              race={senateRace}
              stateAbbr={stateInfo.abbr}
              stateName={stateInfo.name}
              selectedId={selections["senate"]}
              onSelect={(candidateId) => onSelect("senate", candidateId)}
            />
          ) : stateInfo.senateClass2Senator ? (
            <div className="px-3 py-2">
              <BallotBubble
                name={stateInfo.senateClass2Senator}
                party={stateInfo.senateClass2Party ?? "Republican"}
                detail="Incumbent"
                candidateId={`incumbent-${stateInfo.abbr}-senate`}
                isSelected={selections["senate"] === `incumbent-${stateInfo.abbr}-senate`}
                onSelect={(id) => onSelect("senate", id)}
              />
              <PartyBubble
                party={stateInfo.senateClass2Party === "Democrat" ? "Republican" : "Democrat"}
                candidateId={`party-${stateInfo.abbr}-senate-challenger`}
                isSelected={selections["senate"] === `party-${stateInfo.abbr}-senate-challenger`}
                onSelect={(id) => onSelect("senate", id)}
              />
              <p className="text-[11px] text-slate-400 mt-2 pl-7">
                This race isn't expected to be close, but you'll still see it on your ballot.
              </p>
              <ResearchLinks
                ballotpediaUrl={`https://ballotpedia.org/United_States_Senate_election_in_${stateInfo.name.replace(/ /g, "_")},_2026`}
              />
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
              <>
                <p>
                  {stateInfo.name} has <span className="font-semibold">1 at-large seat</span> —
                  {" "}one representative for the whole state. You'll vote for this seat.
                </p>
                <div className="mt-2 space-y-0.5">
                  <PartyBubble
                    party="Democrat"
                    candidateId={`party-${stateInfo.abbr}-house-dem`}
                    isSelected={selections["house"] === `party-${stateInfo.abbr}-house-dem`}
                    onSelect={(id) => onSelect("house", id)}
                  />
                  <PartyBubble
                    party="Republican"
                    candidateId={`party-${stateInfo.abbr}-house-rep`}
                    isSelected={selections["house"] === `party-${stateInfo.abbr}-house-rep`}
                    onSelect={(id) => onSelect("house", id)}
                  />
                </div>
              </>
            ) : (
              <p>
                {stateInfo.name} has <span className="font-semibold">{stateInfo.houseDistricts} congressional districts</span>.
                {" "}You vote only in your district.
              </p>
            )}
            <ResearchLinks
              findDistrictUrl={stateInfo.houseDistricts > 1 ? "https://www.house.gov/representatives/find-your-representative" : undefined}
              ballotpediaUrl={`https://ballotpedia.org/United_States_House_of_Representatives_elections_in_${stateInfo.name.replace(/ /g, "_")},_2026`}
            />
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
              {(() => {
                const govRunningForSenate = stateInfo.currentGovernor && (
                  senateRace?.candidates.democrat.some(c => c.name === stateInfo.currentGovernor) ||
                  senateRace?.candidates.republican.some(c => c.name === stateInfo.currentGovernor)
                );
                const govParty = stateInfo.currentGovernorParty ?? "Republican";
                const oppositionParty = govParty === "Democrat" ? "Republican" : "Democrat";

                if (govRunningForSenate) {
                  // Governor left — open seat, show both party bubbles
                  return (
                    <>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Gov. {stateInfo.currentGovernor} is running for U.S. Senate, so this seat will be open.
                      </p>
                      <PartyBubble
                        party="Democrat"
                        candidateId={`party-${stateInfo.abbr}-gov-dem`}
                        isSelected={selections["governor"] === `party-${stateInfo.abbr}-gov-dem`}
                        onSelect={(id) => onSelect("governor", id)}
                      />
                      <PartyBubble
                        party="Republican"
                        candidateId={`party-${stateInfo.abbr}-gov-rep`}
                        isSelected={selections["governor"] === `party-${stateInfo.abbr}-gov-rep`}
                        onSelect={(id) => onSelect("governor", id)}
                      />
                    </>
                  );
                }

                if (stateInfo.currentGovernor) {
                  // Show incumbent by name + opposition as party bubble
                  return (
                    <>
                      <BallotBubble
                        name={`Gov. ${stateInfo.currentGovernor}`}
                        party={govParty}
                        detail="Incumbent"
                        candidateId={`gov-${stateInfo.abbr}`}
                        isSelected={selections["governor"] === `gov-${stateInfo.abbr}`}
                        onSelect={(id) => onSelect("governor", id)}
                      />
                      <PartyBubble
                        party={oppositionParty}
                        candidateId={`party-${stateInfo.abbr}-gov-${oppositionParty.toLowerCase().slice(0, 3)}`}
                        isSelected={selections["governor"] === `party-${stateInfo.abbr}-gov-${oppositionParty.toLowerCase().slice(0, 3)}`}
                        onSelect={(id) => onSelect("governor", id)}
                      />
                    </>
                  );
                }

                // No governor data — show both party bubbles
                return (
                  <>
                    <PartyBubble
                      party="Democrat"
                      candidateId={`party-${stateInfo.abbr}-gov-dem`}
                      isSelected={selections["governor"] === `party-${stateInfo.abbr}-gov-dem`}
                      onSelect={(id) => onSelect("governor", id)}
                    />
                    <PartyBubble
                      party="Republican"
                      candidateId={`party-${stateInfo.abbr}-gov-rep`}
                      isSelected={selections["governor"] === `party-${stateInfo.abbr}-gov-rep`}
                      onSelect={(id) => onSelect("governor", id)}
                    />
                  </>
                );
              })()}
              <ResearchLinks
                ballotpediaUrl={`https://ballotpedia.org/${stateInfo.name.replace(/ /g, "_")}_gubernatorial_election,_2026`}
              />
            </div>
          ) : (
            <p className="text-xs text-slate-400 px-3 py-2">
              Not up for election in 2026.
            </p>
          )}
        </BallotRow>

        {/* ── BALLOT MEASURES ── */}
        <BallotSectionHeader title="Ballot Measures" />

        {stateMeasures.length > 0 ? (
          stateMeasures.map((bm) => (
            <BallotMeasureRow
              key={bm.id}
              measure={bm}
              selected={selections[`measure-${bm.id}`]}
              onSelect={(value) => onSelect(`measure-${bm.id}`, value)}
            />
          ))
        ) : (
          <BallotRow office="Statewide Ballot Measures" status="unknown">
            <div className="px-3 py-2">
              <p className="text-xs text-slate-500">
                Ballot measures are yes-or-no votes on new laws, constitutional amendments,
                or policy changes. They go directly to voters instead of through the legislature.
              </p>
              <p className="text-[11px] text-tossup mt-1.5">
                No ballot measures tracked yet for {stateInfo.name}
              </p>
            </div>
          </BallotRow>
        )}

        {/* ── FIND YOUR OFFICIAL BALLOT ── */}
        <FindYourBallotCard stateName={stateInfo.name} stateAbbr={stateInfo.abbr} />

        {/* Footer */}
        <div className="border-t-2 border-black mt-4 pt-3">
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            For educational purposes only. Not an official ballot.
            Research your candidates before election day.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Collapsible ballot measure row ---

const MEASURE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  proposed: { label: "Proposed", color: "bg-amber-100 text-amber-700" },
  qualified: { label: "On Ballot", color: "bg-green-100 text-green-700" },
  passed: { label: "Passed", color: "bg-blue-100 text-blue-700" },
  failed: { label: "Failed", color: "bg-red-100 text-red-700" },
};

function BallotMeasureRow({
  measure: bm,
  selected,
  onSelect,
}: {
  measure: BallotMeasure;
  selected: string | undefined;
  onSelect: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusInfo = MEASURE_STATUS_LABELS[bm.status] ?? { label: bm.status, color: "bg-slate-100 text-slate-600" };

  return (
    <div className="border-x border-b border-slate-300">
      {/* Header — tappable to expand/collapse */}
      <button
        type="button"
        className="w-full flex items-start justify-between gap-2 px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-left cursor-pointer hover:bg-slate-150"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <span className="text-xs font-bold text-slate-700 block">{bm.shortTitle || bm.title}</span>
          <span className={`text-[9px] font-semibold uppercase tracking-wide px-1 py-0.5 rounded inline-block mt-0.5 ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
          <span className="text-[9px] font-bold uppercase tracking-wider bg-black text-white px-1.5 py-0.5">
            Yes or No
          </span>
          <svg
            className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Collapsible content */}
      {expanded && (
        <div className="px-3 py-2">
          {bm.shortTitle && (
            <p className="text-[11px] text-slate-600 font-medium mb-1">{bm.title}</p>
          )}
          <p className="text-xs text-slate-500 mb-2 leading-relaxed">{bm.description}</p>

          {/* Yes bubble */}
          <div
            className="flex items-start gap-2 py-1 cursor-pointer group/yes"
            onClick={() => onSelect(`${bm.id}-yes`)}
            role="radio"
            aria-checked={selected === `${bm.id}-yes`}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(`${bm.id}-yes`); } }}
          >
            <span className={`mt-0.5 w-4 h-3 rounded-[50%] border-2 border-green-600 flex-shrink-0 transition-all duration-150 ${
              selected === `${bm.id}-yes` ? "bg-green-600 scale-110 shadow-sm" : "group-hover/yes:scale-105"
            }`} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-semibold ${selected === `${bm.id}-yes` ? "text-green-800" : "text-slate-800"}`}>Yes</span>
                {selected === `${bm.id}-yes` && (
                  <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded font-bold tracking-wide">YOUR PICK</span>
                )}
              </div>
              {bm.yesMeans && <p className="text-[11px] text-slate-400 leading-snug">{bm.yesMeans}</p>}
            </div>
          </div>

          {/* No bubble */}
          <div
            className="flex items-start gap-2 py-1 cursor-pointer group/no"
            onClick={() => onSelect(`${bm.id}-no`)}
            role="radio"
            aria-checked={selected === `${bm.id}-no`}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(`${bm.id}-no`); } }}
          >
            <span className={`mt-0.5 w-4 h-3 rounded-[50%] border-2 border-red-600 flex-shrink-0 transition-all duration-150 ${
              selected === `${bm.id}-no` ? "bg-red-600 scale-110 shadow-sm" : "group-hover/no:scale-105"
            }`} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-semibold ${selected === `${bm.id}-no` ? "text-red-800" : "text-slate-800"}`}>No</span>
                {selected === `${bm.id}-no` && (
                  <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded font-bold tracking-wide">YOUR PICK</span>
                )}
              </div>
              {bm.noMeans && <p className="text-[11px] text-slate-400 leading-snug">{bm.noMeans}</p>}
            </div>
          </div>

          {bm.sourceUrl && (
            <a
              href={bm.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-600 hover:underline mt-1 inline-block pl-6"
            >
              Learn more
            </a>
          )}
        </div>
      )}
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
      <div className="flex items-start justify-between gap-2 px-3 py-1.5 bg-slate-100 border-b border-slate-200">
        <span className="text-xs font-bold text-slate-700 min-w-0">{office}</span>
        {status === "on-ballot" && (
          <span className="text-[9px] font-bold uppercase tracking-wider bg-black text-white px-1.5 py-0.5 flex-shrink-0">
            Vote for one
          </span>
        )}
        {status === "not-this-year" && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex-shrink-0">
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

// --- Party Bubble — select by party without specific candidate name ---

function PartyBubble({
  party,
  candidateId,
  isSelected,
  onSelect,
}: {
  party: string;
  candidateId: string;
  isSelected?: boolean;
  onSelect?: (candidateId: string) => void;
}) {
  const partyLabel =
    party === "Democrat" ? "Democrat" : party === "Republican" ? "Republican" : "Independent";
  const partyAbbr =
    party === "Democrat" ? "DEM" : party === "Republican" ? "REP" : "IND";
  const partyBorderColor =
    party === "Democrat" ? "border-dem" : party === "Republican" ? "border-gop" : "border-ind";
  const partyFillColor =
    party === "Democrat" ? "bg-dem" : party === "Republican" ? "bg-gop" : "bg-ind";

  return (
    <div
      className="flex items-start gap-2 py-1 cursor-pointer group/bubble"
      onClick={() => onSelect?.(candidateId)}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(candidateId); } }}
    >
      <span
        className={`mt-0.5 w-4 h-3 rounded-[50%] border-2 ${partyBorderColor} flex-shrink-0 transition-all duration-150 ${
          isSelected ? `${partyFillColor} scale-110 shadow-sm` : "group-hover/bubble:scale-105"
        }`}
      />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-sm font-semibold ${isSelected ? "text-slate-900" : "text-slate-700"}`}>{partyLabel}</span>
          <span className="text-[10px] text-slate-400 font-medium">{partyAbbr}</span>
          {isSelected && (
            <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded font-bold tracking-wide">
              YOUR PICK
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Research links for a race ---

function ResearchLinks({
  ballotpediaUrl,
  findDistrictUrl,
}: {
  ballotpediaUrl?: string;
  findDistrictUrl?: string;
}) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pl-7">
      {findDistrictUrl && (
        <a
          href={findDistrictUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-dem underline underline-offset-2 hover:decoration-2"
        >
          Find your district
        </a>
      )}
      {ballotpediaUrl && (
        <a
          href={ballotpediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-dem underline underline-offset-2 hover:decoration-2"
        >
          Research candidates on Ballotpedia →
        </a>
      )}
    </div>
  );
}

// --- Find Your Official Ballot card ---

const SOS_URLS: Record<string, string> = {
  AL: "https://www.sos.alabama.gov/alabama-votes",
  AK: "https://www.elections.alaska.gov/",
  AZ: "https://azsos.gov/elections",
  AR: "https://www.sos.arkansas.gov/elections",
  CA: "https://www.sos.ca.gov/elections",
  CO: "https://www.sos.state.co.us/pubs/elections/",
  CT: "https://portal.ct.gov/sots/election-services",
  DE: "https://elections.delaware.gov/",
  FL: "https://dos.fl.gov/elections/",
  GA: "https://sos.ga.gov/elections-division",
  HI: "https://elections.hawaii.gov/",
  ID: "https://sos.idaho.gov/elect/",
  IL: "https://www.elections.il.gov/",
  IN: "https://www.in.gov/sos/elections/",
  IA: "https://sos.iowa.gov/elections/",
  KS: "https://sos.ks.gov/elections/",
  KY: "https://elect.ky.gov/",
  LA: "https://www.sos.la.gov/ElectionsAndVoting/",
  ME: "https://www.maine.gov/sos/cec/elec/",
  MD: "https://elections.maryland.gov/",
  MA: "https://www.sec.state.ma.us/divisions/elections/",
  MI: "https://mvic.sos.state.mi.us/",
  MN: "https://www.sos.mn.gov/elections-voting/",
  MS: "https://www.sos.ms.gov/elections-voting",
  MO: "https://www.sos.mo.gov/elections",
  MT: "https://sosmt.gov/elections/",
  NE: "https://sos.nebraska.gov/elections",
  NV: "https://www.nvsos.gov/sos/elections",
  NH: "https://www.sos.nh.gov/elections",
  NJ: "https://nj.gov/state/elections/",
  NM: "https://www.sos.nm.gov/voting-and-elections/",
  NY: "https://www.elections.ny.gov/",
  NC: "https://www.ncsbe.gov/",
  ND: "https://vip.sos.nd.gov/",
  OH: "https://www.ohiosos.gov/elections/",
  OK: "https://oklahoma.gov/elections.html",
  OR: "https://sos.oregon.gov/voting/Pages/default.aspx",
  PA: "https://www.vote.pa.gov/",
  RI: "https://vote.ri.gov/",
  SC: "https://www.scvotes.gov/",
  SD: "https://sdsos.gov/elections-voting/",
  TN: "https://sos.tn.gov/elections",
  TX: "https://www.sos.texas.gov/elections/",
  UT: "https://voteinfo.utah.gov/",
  VT: "https://sos.vermont.gov/elections/",
  VA: "https://www.elections.virginia.gov/",
  WA: "https://www.sos.wa.gov/elections/",
  WV: "https://sos.wv.gov/elections/",
  WI: "https://elections.wi.gov/",
  WY: "https://sos.wyo.gov/Elections/",
  DC: "https://www.dcboe.org/",
};

function FindYourBallotCard({ stateName, stateAbbr }: { stateName: string; stateAbbr: string }) {
  const sosUrl = SOS_URLS[stateAbbr];

  return (
    <div className="mt-4 bg-navy/5 border border-navy/20 rounded-lg p-3">
      <h3 className="text-xs font-bold text-navy uppercase tracking-wide mb-2">
        Find Your Official Ballot
      </h3>
      <p className="text-[11px] text-slate-600 mb-2.5 leading-relaxed">
        Look up the actual candidates running in {stateName} using these trusted, nonpartisan resources:
      </p>
      <div className="space-y-1.5">
        <a
          href="https://www.vote411.org/ballot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-navy font-medium hover:underline"
        >
          <span className="w-1.5 h-1.5 bg-navy rounded-full flex-shrink-0" />
          Vote411 — Personalized ballot lookup
        </a>
        {sosUrl && (
          <a
            href={sosUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-navy font-medium hover:underline"
          >
            <span className="w-1.5 h-1.5 bg-navy rounded-full flex-shrink-0" />
            {stateName} Secretary of State
          </a>
        )}
        <a
          href="https://ballotpedia.org/Sample_Ballot_Lookup"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-navy font-medium hover:underline"
        >
          <span className="w-1.5 h-1.5 bg-navy rounded-full flex-shrink-0" />
          Ballotpedia — Sample ballot lookup
        </a>
      </div>
    </div>
  );
}

// --- Senate Preview Card (competitive races — party bubbles with rating) ---

function SenatePreviewCard({
  race,
  stateAbbr,
  stateName,
  selectedId,
  onSelect,
}: {
  race: SenateRace;
  stateAbbr: string;
  stateName: string;
  selectedId?: string;
  onSelect?: (candidateId: string) => void;
}) {
  const ratingColor = RATING_COLORS[race.rating] ?? NEUTRAL_COLOR;

  // Show incumbent by name if available, otherwise party bubble
  const incumbent = race.incumbent;
  const hasIncumbent = !!incumbent && !race.isOpenSeat;

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

      {/* Incumbent by name + challenger as party bubble */}
      <div className="space-y-0.5" role="radiogroup" aria-label="Select a party">
        {hasIncumbent ? (
          <>
            <BallotBubble
              name={incumbent.name}
              party={incumbent.party}
              detail="Incumbent"
              isIncumbent
              candidateId={incumbent.id}
              isSelected={selectedId === incumbent.id}
              onSelect={onSelect}
            />
            <PartyBubble
              party={incumbent.party === "Democrat" ? "Republican" : "Democrat"}
              candidateId={`party-${stateAbbr}-senate-challenger`}
              isSelected={selectedId === `party-${stateAbbr}-senate-challenger`}
              onSelect={onSelect}
            />
          </>
        ) : (
          <>
            <PartyBubble
              party="Democrat"
              candidateId={`party-${stateAbbr}-senate-dem`}
              isSelected={selectedId === `party-${stateAbbr}-senate-dem`}
              onSelect={onSelect}
            />
            <PartyBubble
              party="Republican"
              candidateId={`party-${stateAbbr}-senate-rep`}
              isSelected={selectedId === `party-${stateAbbr}-senate-rep`}
              onSelect={onSelect}
            />
          </>
        )}
      </div>

      {/* Why this race matters */}
      {race.whyCompetitive && (
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed border-t border-dashed border-slate-200 pt-2">
          {race.whyCompetitive}
        </p>
      )}

      <ResearchLinks
        ballotpediaUrl={`https://ballotpedia.org/United_States_Senate_election_in_${stateName.replace(/ /g, "_")},_2026`}
      />
    </div>
  );
}
