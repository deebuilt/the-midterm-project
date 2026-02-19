import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { HouseSeat, HouseSeatsData } from "../../lib/queries";

// ─── Types ───

type Seat = HouseSeat;
type HouseData = HouseSeatsData;
type Mode = "flip" | "rainbow" | "reelect";
type ReelectChoice = "reelect" | "reject";

interface SeatPosition {
  x: number;
  y: number;
  angle: number;
  seatIndex: number;
}

// ─── Constants ───

const STORAGE_KEYS: Record<Mode, string> = {
  flip: "house-flip-choices",
  rainbow: "house-rainbow-choices",
  reelect: "house-chamber-choices",
};

// Full ROYGBIV spectrum
const RAINBOW_COLORS = ["#e40303", "#ff8c00", "#ffed00", "#008026", "#2563eb", "#4b0082", "#7c3aed"] as const;
const RAINBOW_NAMES = ["Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Violet"] as const;

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const MAJORITY = 218;

// ─── localStorage helpers ───

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Semicircle seat layout ───

function computeSeatPositions(seats: Seat[]) {
  const total = seats.length;
  const ROWS = 12;
  const INNER_RADIUS = 100;
  const ROW_SPACING = 21;
  const SEAT_W = 15;
  const SEAT_H = 11;
  const SEAT_RX = 2.5;
  const GAP = 4;

  const rowCapacities: number[] = [];
  let totalCapacity = 0;
  for (let r = 0; r < ROWS; r++) {
    const radius = INNER_RADIUS + r * ROW_SPACING;
    const circumference = Math.PI * radius;
    const seatsInRow = Math.floor(circumference / (SEAT_W + GAP));
    rowCapacities.push(seatsInRow);
    totalCapacity += seatsInRow;
  }

  const scale = total / totalCapacity;
  const adjustedCapacities = rowCapacities.map((c) => Math.round(c * scale));

  let diff = total - adjustedCapacities.reduce((a, b) => a + b, 0);
  for (let r = adjustedCapacities.length - 1; diff !== 0 && r >= 0; r--) {
    const change = diff > 0 ? 1 : -1;
    adjustedCapacities[r] += change;
    diff -= change;
  }

  const positions: SeatPosition[] = [];
  let seatIdx = 0;

  for (let r = 0; r < ROWS; r++) {
    const radius = INNER_RADIUS + r * ROW_SPACING;
    const n = adjustedCapacities[r];
    if (n <= 0) continue;

    for (let i = 0; i < n && seatIdx < total; i++) {
      const angle = Math.PI - (i / (n - 1 || 1)) * Math.PI;
      // Round to 2 decimals to avoid SSR/client hydration mismatch from
      // floating-point differences between Node.js and the browser
      const x = Math.round(radius * Math.cos(angle) * 100) / 100;
      const y = Math.round(-radius * Math.sin(angle) * 100) / 100;
      positions.push({ x, y, angle, seatIndex: seatIdx });
      seatIdx++;
    }
  }

  const outerRadius = INNER_RADIUS + (ROWS - 1) * ROW_SPACING + SEAT_H / 2 + 10;
  return { positions, seatW: SEAT_W, seatH: SEAT_H, seatRx: SEAT_RX, outerRadius };
}

// ─── External link icon ───

function ExtLinkIcon() {
  return (
    <svg className="w-3.5 h-3.5 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

// ─── Close button ───

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1" aria-label="Close">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

// ─── Majority Progress Bar (for flip mode) ───

function MajorityBar({ resultD, resultR, total }: { resultD: number; resultR: number; total: number }) {
  const dPct = (resultD / total) * 100;
  const rPct = (resultR / total) * 100;
  const dHasMajority = resultD >= MAJORITY;
  const rHasMajority = resultR >= MAJORITY;
  const majorityPct = (MAJORITY / total) * 100;

  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs font-bold mb-1">
        <span className={dHasMajority ? "text-dem" : "text-slate-500"}>
          {resultD} D {dHasMajority && "— MAJORITY"}
        </span>
        <span className="text-slate-400">{MAJORITY} to win</span>
        <span className={rHasMajority ? "text-gop" : "text-slate-500"}>
          {rHasMajority && "MAJORITY — "}{resultR} R
        </span>
      </div>
      <div className="relative h-5 rounded-full overflow-hidden bg-slate-200 flex">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${dPct}%`, backgroundColor: "#2563eb" }}
        />
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${rPct}%`, backgroundColor: "#dc2626" }}
        />
        {/* Majority marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white"
          style={{ left: `${majorityPct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Detail Cards per Mode ───

function FlipDetailCard({ seat, isFlipped, onClose }: {
  seat: Seat;
  isFlipped: boolean;
  onClose: () => void;
}) {
  const districtLabel = seat.isAtLarge
    ? `${STATE_NAMES[seat.state] || seat.state} — At-Large`
    : `${STATE_NAMES[seat.state] || seat.state} — District ${seat.district}`;

  if (seat.isVacant) {
    return (
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 max-w-sm w-full">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg leading-tight text-slate-400">Vacant Seat</h3>
            <p className="text-sm text-slate-500">{districtLabel}</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>
        <p className="text-sm text-slate-500 mt-3">This seat is currently vacant.</p>
      </div>
    );
  }

  const originalParty = seat.party === "D" ? "Democrat" : seat.party === "R" ? "Republican" : "Independent";
  const flippedParty = seat.party === "D" ? "Republican" : "Democrat";
  const flippedColor = seat.party === "D" ? "bg-gop" : "bg-dem";
  const originalColor = seat.party === "D" ? "bg-dem" : seat.party === "R" ? "bg-gop" : "bg-ind";

  if (isFlipped) {
    // Flipped: show silhouette placeholder, not the candidate's face
    return (
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 max-w-sm w-full">
        <div className="flex items-start gap-3">
          <img
            src="/images/placeholder.svg"
            alt="Flipped seat"
            className="w-14 h-18 rounded-lg object-cover bg-slate-100"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg leading-tight text-slate-400 line-through">{seat.name}</h3>
              <CloseButton onClick={onClose} />
            </div>
            <p className="text-sm text-slate-500">{districtLabel}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs text-white/60 font-bold px-2 py-0.5 rounded-full ${originalColor} line-through`}>
                {originalParty}
              </span>
            </div>
          </div>
        </div>
        <div className={`mt-3 text-sm font-bold text-white px-3 py-2 rounded-lg text-center ${flippedColor}`}>
          Flipped to {flippedParty}
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">Tap the seat again to undo</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 max-w-sm w-full">
      <div className="flex items-start gap-3">
        <img
          src={seat.photo}
          alt={seat.name}
          className="w-14 h-18 rounded-lg object-cover object-[center_20%] bg-slate-100"
          onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder.svg"; }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg leading-tight">{seat.name}</h3>
            <CloseButton onClick={onClose} />
          </div>
          <p className="text-sm text-slate-500">{districtLabel}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs text-white font-bold px-2 py-0.5 rounded-full ${originalColor}`}>
              {originalParty}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-400 text-center">Tap the seat to flip it</p>
    </div>
  );
}

function ReelectDetailCard({ seat, choice, onReelect, onReject, onClear, onClose }: {
  seat: Seat;
  choice: ReelectChoice | undefined;
  onReelect: () => void;
  onReject: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const districtLabel = seat.isAtLarge
    ? `${STATE_NAMES[seat.state] || seat.state} — At-Large`
    : `${STATE_NAMES[seat.state] || seat.state} — District ${seat.district}`;

  if (seat.isVacant) {
    return (
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 max-w-sm w-full">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg leading-tight text-slate-400">Vacant Seat</h3>
            <p className="text-sm text-slate-500">{districtLabel}</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>
        <p className="text-sm text-slate-500 mt-3">This seat is currently vacant.</p>
      </div>
    );
  }

  const partyLabel = seat.party === "D" ? "Democrat" : seat.party === "R" ? "Republican" : "Independent";
  const partyColor = seat.party === "D" ? "bg-dem" : seat.party === "R" ? "bg-gop" : "bg-ind";
  const tenure = seat.firstYear ? `Since ${seat.firstYear}` : null;

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 max-w-sm w-full">
      <div className="flex items-start gap-3">
        <img
          src={seat.photo}
          alt={seat.name}
          className="w-16 h-20 rounded-lg object-cover object-[center_20%] bg-slate-100"
          onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder.svg"; }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg leading-tight">{seat.name}</h3>
            <CloseButton onClick={onClose} />
          </div>
          <p className="text-sm text-slate-500">{districtLabel}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs text-white font-bold px-2 py-0.5 rounded-full ${partyColor}`}>
              {partyLabel}
            </span>
            {tenure && (
              <span className="text-xs text-slate-400 font-medium">{tenure}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3 text-xs">
        {seat.website && (
          <a href={seat.website} target="_blank" rel="noopener noreferrer" className="text-navy hover:underline">
            Website<ExtLinkIcon />
          </a>
        )}
        {seat.twitter && (
          <a href={`https://x.com/${seat.twitter}`} target="_blank" rel="noopener noreferrer" className="text-navy hover:underline">
            @{seat.twitter}<ExtLinkIcon />
          </a>
        )}
        {seat.govtrackId && (
          <a
            href={`https://www.govtrack.us/congress/members/${seat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}/${seat.govtrackId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-navy hover:underline"
          >
            GovTrack<ExtLinkIcon />
          </a>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onReelect}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
            choice === "reelect"
              ? "bg-emerald-500 text-white"
              : "bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700"
          }`}
        >
          {choice === "reelect" ? "Re-elected" : "Re-elect"}
        </button>
        <button
          onClick={onReject}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
            choice === "reject"
              ? "bg-slate-700 text-white"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          {choice === "reject" ? "Rejected" : "Reject"}
        </button>
        {choice && (
          <button
            onClick={onClear}
            className="px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Clear choice"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
}

function RainbowDetailCard({ seat, colorIndex, onClose }: {
  seat: Seat;
  colorIndex: number | undefined;
  onClose: () => void;
}) {
  const districtLabel = seat.isAtLarge
    ? `${STATE_NAMES[seat.state] || seat.state} — At-Large`
    : `${STATE_NAMES[seat.state] || seat.state} — District ${seat.district}`;

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 max-w-sm w-full">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-lg leading-tight">{seat.isVacant ? "Vacant Seat" : seat.name}</h3>
          <p className="text-sm text-slate-500">{districtLabel}</p>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      {colorIndex !== undefined ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded" style={{ backgroundColor: RAINBOW_COLORS[colorIndex] }} />
          <span className="text-sm font-medium">{RAINBOW_NAMES[colorIndex]}</span>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">Tap the seat to paint it</p>
      )}
    </div>
  );
}

// ─── Mode Switcher ───

function ModeSwitcher({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const modes: { key: Mode; label: string }[] = [
    { key: "flip", label: "Flip the House" },
    { key: "rainbow", label: "Rainbow" },
    { key: "reelect", label: "Re-elect or Reject" },
  ];

  return (
    <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-4">
      {modes.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs sm:text-sm font-medium transition-all ${
            mode === m.key
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───

interface HouseChamberProps {
  data: HouseData;
}

export default function HouseChamber({ data }: HouseChamberProps) {
  const [mode, setMode] = useState<Mode>("flip");
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [stateFilter, setStateFilter] = useState<string>("");
  const [tappedSeats, setTappedSeats] = useState<Set<string>>(new Set());
  const svgRef = useRef<SVGSVGElement>(null);

  // Per-mode state
  const [flipChoices, setFlipChoices] = useState<Record<string, "flipped">>({});
  const [rainbowChoices, setRainbowChoices] = useState<Record<string, number>>({});
  const [reelectChoices, setReelectChoices] = useState<Record<string, ReelectChoice>>({});

  // Load all mode choices from localStorage
  useEffect(() => {
    setFlipChoices(loadStorage(STORAGE_KEYS.flip, {}));
    setRainbowChoices(loadStorage(STORAGE_KEYS.rainbow, {}));
    setReelectChoices(loadStorage(STORAGE_KEYS.reelect, {}));
  }, []);

  // ── Flip mode helpers ──
  const toggleFlip = useCallback((seatId: string) => {
    setFlipChoices((prev) => {
      const next = { ...prev };
      if (next[seatId]) {
        delete next[seatId];
      } else {
        next[seatId] = "flipped";
      }
      saveStorage(STORAGE_KEYS.flip, next);
      return next;
    });
  }, []);

  // ── Rainbow mode helpers ──
  const cycleRainbow = useCallback((seatId: string) => {
    setRainbowChoices((prev) => {
      const current = prev[seatId];
      const next = { ...prev };
      if (current === undefined) {
        next[seatId] = 0;
      } else if (current >= RAINBOW_COLORS.length - 1) {
        delete next[seatId];
      } else {
        next[seatId] = current + 1;
      }
      saveStorage(STORAGE_KEYS.rainbow, next);
      return next;
    });
  }, []);

  // Paint the Rainbow — auto-assign colors based on seat position in the arc
  const paintTheRainbow = useCallback(() => {
    const total = data.seats.length;
    const next: Record<string, number> = {};
    for (let i = 0; i < total; i++) {
      const seat = data.seats[i];
      // Map seat index to a rainbow color (spread evenly across the arc)
      const colorIdx = Math.floor((i / total) * RAINBOW_COLORS.length);
      next[seat.id] = Math.min(colorIdx, RAINBOW_COLORS.length - 1);
    }
    setRainbowChoices(next);
    saveStorage(STORAGE_KEYS.rainbow, next);
    setSelectedSeat(null);
  }, [data.seats]);

  // ── Re-elect mode helpers ──
  const updateReelect = useCallback((seatId: string, choice: ReelectChoice) => {
    setReelectChoices((prev) => {
      const next = { ...prev, [seatId]: choice };
      saveStorage(STORAGE_KEYS.reelect, next);
      return next;
    });
  }, []);

  const clearReelect = useCallback((seatId: string) => {
    setReelectChoices((prev) => {
      const next = { ...prev };
      delete next[seatId];
      saveStorage(STORAGE_KEYS.reelect, next);
      return next;
    });
  }, []);

  // ── Bounce animation trigger ──
  const triggerBounce = useCallback((seatId: string) => {
    setTappedSeats((prev) => new Set(prev).add(seatId));
    setTimeout(() => {
      setTappedSeats((prev) => {
        const next = new Set(prev);
        next.delete(seatId);
        return next;
      });
    }, 250);
  }, []);

  // ── Seat click handler — depends on mode ──
  const handleSeatClick = useCallback((seat: Seat) => {
    if (seat.isVacant) {
      setSelectedSeat((s) => s?.id === seat.id ? null : seat);
      return;
    }

    if (mode === "flip") {
      toggleFlip(seat.id);
      triggerBounce(seat.id);
      setSelectedSeat(seat);
    } else if (mode === "rainbow") {
      cycleRainbow(seat.id);
      triggerBounce(seat.id);
      setSelectedSeat(seat);
    } else {
      setSelectedSeat((s) => s?.id === seat.id ? null : seat);
    }
  }, [mode, toggleFlip, cycleRainbow, triggerBounce]);

  // Clear selected seat on mode change
  useEffect(() => {
    setSelectedSeat(null);
  }, [mode]);

  // Seat positions
  const layout = useMemo(() => computeSeatPositions(data.seats), [data]);

  // States list for filter
  const statesList = useMemo(() => {
    const states = new Set(data.seats.map((s) => s.state));
    return [...states].sort().map((abbr) => ({ abbr, name: STATE_NAMES[abbr] || abbr }));
  }, [data]);

  // ── Stats per mode ──
  const stats = useMemo(() => {
    if (mode === "flip") {
      const flipped = Object.keys(flipChoices).length;
      let dFlipped = 0, rFlipped = 0;
      for (const seatId of Object.keys(flipChoices)) {
        const seat = data.seats.find((s) => s.id === seatId);
        if (seat?.party === "R") dFlipped++;
        else if (seat?.party === "D") rFlipped++;
      }
      const baseD = data.parties.D;
      const baseR = data.parties.R;
      return {
        mode: "flip" as const,
        flipped,
        resultD: baseD - rFlipped + dFlipped,
        resultR: baseR - dFlipped + rFlipped,
      };
    } else if (mode === "rainbow") {
      return { mode: "rainbow" as const, painted: Object.keys(rainbowChoices).length };
    } else {
      const reelected = Object.values(reelectChoices).filter((c) => c === "reelect").length;
      const rejected = Object.values(reelectChoices).filter((c) => c === "reject").length;
      return { mode: "reelect" as const, total: reelected + rejected, reelected, rejected };
    }
  }, [mode, flipChoices, rainbowChoices, reelectChoices, data]);

  const { positions, seatW, seatH, seatRx, outerRadius } = layout;
  const viewBoxPadding = 30;
  const vbLeft = -(outerRadius + viewBoxPadding);
  const vbTop = -(outerRadius + viewBoxPadding);
  const vbWidth = (outerRadius + viewBoxPadding) * 2;
  const vbHeight = outerRadius + viewBoxPadding + 20;

  // ── Seat fill color — depends on mode ──
  function seatFill(seat: Seat): string {
    const dimmed = !!(stateFilter && seat.state !== stateFilter);

    if (seat.isVacant) {
      return dimmed ? "#f1f5f9" : "#cbd5e1";
    }

    if (mode === "flip") {
      const isFlipped = !!flipChoices[seat.id];
      const effectiveParty = isFlipped
        ? (seat.party === "D" ? "R" : seat.party === "R" ? "D" : seat.party)
        : seat.party;
      if (dimmed) return "#e2e8f0";
      if (effectiveParty === "D") return "#2563eb";
      if (effectiveParty === "R") return "#dc2626";
      return "#6b7280";
    }

    if (mode === "rainbow") {
      const colorIdx = rainbowChoices[seat.id];
      if (colorIdx !== undefined) {
        return dimmed ? `${RAINBOW_COLORS[colorIdx]}40` : RAINBOW_COLORS[colorIdx];
      }
      if (dimmed) return "#e2e8f0";
      if (seat.party === "D") return "#2563eb";
      if (seat.party === "R") return "#dc2626";
      return "#6b7280";
    }

    // Re-elect mode
    const choice = reelectChoices[seat.id];
    if (choice === "reelect") return dimmed ? "#d1fae5" : "#10b981";
    if (choice === "reject") return dimmed ? "#e2e8f0" : "#475569";
    if (dimmed) return "#e2e8f0";
    if (seat.party === "D") return "#2563eb";
    if (seat.party === "R") return "#dc2626";
    return "#6b7280";
  }

  function seatStrokeInfo(seat: Seat, isSelected: boolean): { stroke: string; width: number } {
    if (isSelected) return { stroke: "#ffffff", width: 2.5 };
    if (mode === "reelect" && reelectChoices[seat.id] === "reject") return { stroke: "#94a3b8", width: 1.5 };
    return { stroke: "none", width: 0 };
  }

  function seatOpacity(seat: Seat): number {
    if (stateFilter && seat.state !== stateFilter) return 0.3;
    return 1;
  }

  // ── Reset handler for current mode ──
  function handleReset() {
    if (mode === "flip") {
      setFlipChoices({});
      saveStorage(STORAGE_KEYS.flip, {});
    } else if (mode === "rainbow") {
      setRainbowChoices({});
      saveStorage(STORAGE_KEYS.rainbow, {});
    } else {
      setReelectChoices({});
      saveStorage(STORAGE_KEYS.reelect, {});
    }
    setSelectedSeat(null);
  }

  // ── Stat line UI ──
  function renderStats() {
    if (stats.mode === "flip" && stats.flipped > 0) {
      return (
        <div className="flex items-center gap-3 text-xs ml-auto">
          <span className="text-slate-400 font-medium">{stats.flipped} flipped</span>
          <button onClick={handleReset} className="text-slate-400 hover:text-slate-600 underline">Reset</button>
        </div>
      );
    }
    if (stats.mode === "rainbow" && stats.painted > 0) {
      return (
        <div className="flex items-center gap-3 text-xs ml-auto">
          <span className="text-slate-500 font-bold">{stats.painted} painted</span>
          <button onClick={handleReset} className="text-slate-400 hover:text-slate-600 underline">Reset</button>
        </div>
      );
    }
    if (stats.mode === "reelect" && stats.total > 0) {
      return (
        <div className="flex items-center gap-3 text-xs ml-auto">
          <span className="text-emerald-600 font-bold">{stats.reelected} re-elected</span>
          <span className="text-slate-500 font-bold">{stats.rejected} rejected</span>
          <button onClick={handleReset} className="text-slate-400 hover:text-slate-600 underline">Reset</button>
        </div>
      );
    }
    return null;
  }

  // ── Legend per mode ──
  function renderLegend() {
    if (mode === "flip") {
      return (
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 justify-center">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-3.5 rounded bg-dem inline-block" /> Democrat
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-3.5 rounded bg-gop inline-block" /> Republican
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-3.5 rounded bg-slate-300 inline-block" /> Vacant
          </span>
        </div>
      );
    }
    if (mode === "rainbow") {
      return (
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500 justify-center">
          {RAINBOW_COLORS.map((color, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="w-5 h-3.5 rounded inline-block" style={{ backgroundColor: color }} />
              {RAINBOW_NAMES[i]}
            </span>
          ))}
        </div>
      );
    }
    return (
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 justify-center">
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-3.5 rounded bg-dem inline-block" /> Democrat
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-3.5 rounded bg-gop inline-block" /> Republican
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-3.5 rounded bg-emerald-500 inline-block" /> Re-elected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-3.5 rounded border-2 border-slate-400 inline-block" /> Rejected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-3.5 rounded bg-slate-300 inline-block" /> Vacant
        </span>
      </div>
    );
  }

  // ── Detail card per mode ──
  function renderDetailCard() {
    if (!selectedSeat) return null;

    if (mode === "flip") {
      return (
        <FlipDetailCard
          seat={selectedSeat}
          isFlipped={!!flipChoices[selectedSeat.id]}
          onClose={() => setSelectedSeat(null)}
        />
      );
    }
    if (mode === "rainbow") {
      return (
        <RainbowDetailCard
          seat={selectedSeat}
          colorIndex={rainbowChoices[selectedSeat.id]}
          onClose={() => setSelectedSeat(null)}
        />
      );
    }
    return (
      <ReelectDetailCard
        seat={selectedSeat}
        choice={reelectChoices[selectedSeat.id]}
        onReelect={() => { updateReelect(selectedSeat.id, "reelect"); triggerBounce(selectedSeat.id); }}
        onReject={() => { updateReelect(selectedSeat.id, "reject"); triggerBounce(selectedSeat.id); }}
        onClear={() => clearReelect(selectedSeat.id)}
        onClose={() => setSelectedSeat(null)}
      />
    );
  }

  return (
    <div>
      <style>{`
        @keyframes seatPop {
          0%   { transform: scale(1); }
          35%  { transform: scale(1.28); }
          65%  { transform: scale(1.10); }
          100% { transform: scale(1); }
        }
        .seat-pop rect:first-child {
          animation: seatPop 0.22s ease-out;
        }
      `}</style>

      {/* Mode switcher */}
      <ModeSwitcher mode={mode} onChange={setMode} />

      {/* Flip mode: majority progress bar */}
      {mode === "flip" && (
        <MajorityBar
          resultD={stats.mode === "flip" ? stats.resultD : data.parties.D}
          resultR={stats.mode === "flip" ? stats.resultR : data.parties.R}
          total={data.total}
        />
      )}

      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={stateFilter}
          onChange={(e) => { setStateFilter(e.target.value); setSelectedSeat(null); }}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All states</option>
          {statesList.map((s) => (
            <option key={s.abbr} value={s.abbr}>{s.name}</option>
          ))}
        </select>

        {/* Party counts (not in rainbow mode — irrelevant there) */}
        {mode !== "rainbow" && (
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1">
              <span className="w-5 h-3.5 rounded bg-dem inline-block" />
              {data.parties.D} D
            </span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-3.5 rounded bg-gop inline-block" />
              {data.parties.R} R
            </span>
          </div>
        )}

        {/* Rainbow: Paint the Rainbow button */}
        {mode === "rainbow" && (
          <button
            onClick={paintTheRainbow}
            className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-colors"
            style={{
              background: "linear-gradient(90deg, #e40303, #ff8c00, #ffed00, #008026, #2563eb, #4b0082, #7c3aed)",
            }}
          >
            Paint the Rainbow
          </button>
        )}

        {renderStats()}
      </div>

      {/* Chamber SVG */}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`${vbLeft} ${vbTop} ${vbWidth} ${vbHeight}`}
          className="w-full max-h-[60vh]"
          role="img"
          aria-label={`U.S. House of Representatives chamber with ${data.total} seats`}
        >
          {/* Speaker's podium */}
          <rect x={-20} y={-8} width={40} height={16} rx={4} fill="#1e293b" />
          <text x={0} y={4} textAnchor="middle" fill="white" fontSize={6} fontWeight="bold">
            SPEAKER
          </text>

          {/* Aisle line */}
          <line
            x1={0}
            y1={-(outerRadius + 5)}
            x2={0}
            y2={-80}
            stroke="#cbd5e1"
            strokeWidth={1}
            strokeDasharray="4 4"
          />

          {/* Seats */}
          {positions.map((pos) => {
            const seat = data.seats[pos.seatIndex];
            if (!seat) return null;

            const isSelected = selectedSeat?.id === seat.id;
            const strokeInfo = seatStrokeInfo(seat, isSelected);
            const rotDeg = Math.round((90 - (pos.angle * 180) / Math.PI) * 100) / 100;
            const isTapped = tappedSeats.has(seat.id);

            return (
              <g
                key={seat.id}
                transform={`translate(${pos.x}, ${pos.y}) rotate(${rotDeg})`}
                opacity={seatOpacity(seat)}
                className={isTapped ? "seat-pop" : ""}
              >
                <rect
                  x={-seatW / 2}
                  y={-seatH / 2}
                  width={seatW}
                  height={seatH}
                  rx={seatRx}
                  ry={seatRx}
                  fill={seatFill(seat)}
                  stroke={strokeInfo.stroke}
                  strokeWidth={strokeInfo.width}
                  pointerEvents="none"
                  style={{ transition: "fill 0.25s ease" }}
                />
                <rect
                  x={-(seatW + 6) / 2}
                  y={-(seatH + 8) / 2}
                  width={seatW + 6}
                  height={seatH + 8}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => handleSeatClick(seat)}
                  role="button"
                  tabIndex={0}
                  aria-label={seat.isVacant ? `Vacant seat, ${seat.state}-${seat.district}` : `${seat.name}, ${seat.party === "D" ? "Democrat" : "Republican"}, ${seat.state}-${seat.district}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSeatClick(seat);
                    }
                  }}
                >
                  <title>{seat.isVacant ? `Vacant — ${seat.state}-${seat.district}` : `${seat.name} (${seat.party}) — ${seat.state}-${seat.district}`}</title>
                </rect>
              </g>
            );
          })}

          {/* Left / Right labels */}
          <text x={-(outerRadius - 20)} y={-(outerRadius - 10)} fill="#94a3b8" fontSize={8} textAnchor="middle">
            Democrats
          </text>
          <text x={outerRadius - 20} y={-(outerRadius - 10)} fill="#94a3b8" fontSize={8} textAnchor="middle">
            Republicans
          </text>
        </svg>

        {/* Detail card — below SVG on mobile, overlaid on desktop */}
        {selectedSeat && (
          <div className="mt-4 flex justify-center md:absolute md:mt-0 md:bottom-4 md:left-1/2 md:-translate-x-1/2 z-10">
            {renderDetailCard()}
          </div>
        )}
      </div>

      {/* State filter quick stats */}
      {stateFilter && (
        <div className="mt-4 bg-slate-50 rounded-lg p-4">
          <h3 className="font-bold text-sm mb-1">
            {STATE_NAMES[stateFilter] || stateFilter} delegation
          </h3>
          {(() => {
            const stateSeats = data.seats.filter((s) => s.state === stateFilter);
            const dems = stateSeats.filter((s) => s.party === "D").length;
            const reps = stateSeats.filter((s) => s.party === "R").length;
            return (
              <p className="text-xs text-slate-500">
                {stateSeats.length} seat{stateSeats.length !== 1 ? "s" : ""} — {dems}D, {reps}R
              </p>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      {renderLegend()}
    </div>
  );
}
