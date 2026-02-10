import { useState, useMemo } from "react";
import type { GovernorRace } from "../../types";

interface GovernorRacesProps {
  races: GovernorRace[];
}

const RATING_COLORS: Record<string, string> = {
  "Toss-up": "#d97706",
  "Lean D": "#3b82f6",
  "Lean R": "#ef4444",
  "Likely D": "#2563eb",
  "Likely R": "#dc2626",
  "Safe D": "#1d4ed8",
  "Safe R": "#b91c1c",
};

const PARTY_COLORS: Record<string, string> = {
  Democrat: "#2563eb",
  Republican: "#dc2626",
  Independent: "#6d28d9",
};

type ViewMode = "competitive" | "all";

export default function GovernorRaces({ races }: GovernorRacesProps) {
  const [view, setView] = useState<ViewMode>("competitive");
  const [expandedRace, setExpandedRace] = useState<string | null>(null);

  const competitive = useMemo(
    () =>
      races.filter((r) =>
        ["Toss-up", "Lean R", "Lean D", "Likely R", "Likely D"].includes(r.rating)
      ),
    [races]
  );

  const safe = useMemo(
    () => races.filter((r) => r.rating === "Safe R" || r.rating === "Safe D"),
    [races]
  );

  const grouped = useMemo(() => {
    const tossups = competitive.filter((r) => r.rating === "Toss-up");
    const lean = competitive.filter(
      (r) => r.rating === "Lean R" || r.rating === "Lean D"
    );
    const likely = competitive.filter(
      (r) => r.rating === "Likely R" || r.rating === "Likely D"
    );
    return { tossups, lean, likely };
  }, [competitive]);

  const safeGrouped = useMemo(() => {
    const safeR = safe.filter((r) => r.rating === "Safe R");
    const safeD = safe.filter((r) => r.rating === "Safe D");
    return { safeR, safeD };
  }, [safe]);

  const raceKey = (r: GovernorRace) => r.stateAbbr;

  const renderRaceCard = (race: GovernorRace, compact = false) => {
    const key = raceKey(race);
    const isExpanded = expandedRace === key;

    return (
      <div
        key={key}
        onClick={() => setExpandedRace(isExpanded ? null : key)}
        style={{
          border: `1px solid ${isExpanded ? RATING_COLORS[race.rating] ?? "#e2e8f0" : "#e2e8f0"}`,
          borderLeft: `4px solid ${RATING_COLORS[race.rating] ?? "#94a3b8"}`,
          borderRadius: 8,
          padding: compact ? 12 : 16,
          background: isExpanded ? "#f8fafc" : "#fff",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: compact ? 14 : 16 }}>
              {race.state}
            </div>
            {!compact && race.incumbent && (
              <div style={{ fontSize: 13, color: "#64748b" }}>
                Gov.{" "}
                <span
                  style={{
                    color: PARTY_COLORS[race.incumbent.party] ?? "#64748b",
                    fontWeight: 500,
                  }}
                >
                  {race.incumbent.name} ({race.incumbent.party.charAt(0)})
                </span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            {race.isOpenSeat && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 12,
                  background: "#fef3c7",
                  color: "#92400e",
                }}
              >
                Open Seat
              </span>
            )}
            {race.isTermLimited && race.isOpenSeat && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 12,
                  background: "#f1f5f9",
                  color: "#475569",
                }}
              >
                Term Limited
              </span>
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 12,
                background: `${RATING_COLORS[race.rating]}15`,
                color: RATING_COLORS[race.rating],
              }}
            >
              {race.rating}
            </span>
          </div>
        </div>

        {/* Candidates summary */}
        {!compact &&
          (race.candidates.democrat.length > 0 ||
            race.candidates.republican.length > 0) && (
            <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
              {race.candidates.democrat.length > 0 && (
                <span style={{ color: PARTY_COLORS.Democrat }}>
                  {race.candidates.democrat.length}D
                </span>
              )}
              {race.candidates.democrat.length > 0 &&
                race.candidates.republican.length > 0 &&
                " vs "}
              {race.candidates.republican.length > 0 && (
                <span style={{ color: PARTY_COLORS.Republican }}>
                  {race.candidates.republican.length}R
                </span>
              )}
            </div>
          )}

        {/* Expanded details */}
        {isExpanded && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid #e2e8f0",
            }}
          >
            {race.whyCompetitive && (
              <p
                style={{
                  fontSize: 13,
                  color: "#475569",
                  lineHeight: 1.5,
                  marginBottom: 8,
                }}
              >
                {race.whyCompetitive}
              </p>
            )}

            {race.primaryDate && (
              <p style={{ fontSize: 12, color: "#94a3b8" }}>
                Primary:{" "}
                {new Date(race.primaryDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}

            {/* Candidate list */}
            {[
              ...race.candidates.democrat,
              ...race.candidates.republican,
              ...(race.candidates.independent ?? []),
            ].map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 8,
                  fontSize: 13,
                }}
              >
                {c.photo && (
                  <img
                    src={c.photo}
                    alt={c.name}
                    style={{
                      width: 32,
                      height: 40,
                      objectFit: "cover",
                      borderRadius: 4,
                      background: "#e2e8f0",
                    }}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div>
                  <span
                    style={{
                      fontWeight: 600,
                      color: PARTY_COLORS[c.party] ?? "#475569",
                    }}
                  >
                    {c.name}
                  </span>
                  {c.currentRole && (
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      {c.currentRole}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <a
              href={`/map#${race.stateAbbr}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "inline-block",
                marginTop: 10,
                fontSize: 12,
                color: "#2563eb",
                fontWeight: 500,
              }}
            >
              View on map &rarr;
            </a>
          </div>
        )}
      </div>
    );
  };

  const renderTierSection = (
    label: string,
    dotColor: string,
    tierRaces: GovernorRace[]
  ) => {
    if (tierRaces.length === 0) return null;
    return (
      <div style={{ marginBottom: 32 }}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: dotColor,
            }}
          />
          {label}
          <span
            style={{ fontSize: 14, fontWeight: 400, color: "#94a3b8" }}
          >
            ({tierRaces.length})
          </span>
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 12,
          }}
        >
          {tierRaces.map((race) => renderRaceCard(race))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* View toggle */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <button
          onClick={() => setView("competitive")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            background: view === "competitive" ? "#0f172a" : "#fff",
            color: view === "competitive" ? "#fff" : "#475569",
          }}
        >
          Competitive ({competitive.length})
        </button>
        <button
          onClick={() => setView("all")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            background: view === "all" ? "#0f172a" : "#fff",
            color: view === "all" ? "#fff" : "#475569",
          }}
        >
          All {races.length} Races
        </button>
      </div>

      {view === "competitive" && (
        <>
          {renderTierSection("Toss-Up Races", "#d97706", grouped.tossups)}
          {renderTierSection("Lean Races", "#64748b", grouped.lean)}
          {renderTierSection("Likely Races", "#94a3b8", grouped.likely)}
          {competitive.length === 0 && (
            <p
              style={{
                fontSize: 14,
                color: "#94a3b8",
                textAlign: "center",
                padding: 32,
              }}
            >
              No competitive governor races found.
            </p>
          )}
        </>
      )}

      {view === "all" && (
        <>
          {renderTierSection("Toss-Up Races", "#d97706", grouped.tossups)}
          {renderTierSection("Lean Races", "#64748b", grouped.lean)}
          {renderTierSection("Likely Races", "#94a3b8", grouped.likely)}

          {/* Safe R */}
          {safeGrouped.safeR.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#b91c1c",
                  }}
                />
                Safe Republican
                <span
                  style={{ fontSize: 14, fontWeight: 400, color: "#94a3b8" }}
                >
                  ({safeGrouped.safeR.length})
                </span>
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 8,
                }}
              >
                {safeGrouped.safeR.map((race) => renderRaceCard(race, true))}
              </div>
            </div>
          )}

          {/* Safe D */}
          {safeGrouped.safeD.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#1d4ed8",
                  }}
                />
                Safe Democrat
                <span
                  style={{ fontSize: 14, fontWeight: 400, color: "#94a3b8" }}
                >
                  ({safeGrouped.safeD.length})
                </span>
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 8,
                }}
              >
                {safeGrouped.safeD.map((race) => renderRaceCard(race, true))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
