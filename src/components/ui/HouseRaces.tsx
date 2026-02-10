import { useState, useMemo } from "react";
import type { HouseRace } from "../../types";

interface HouseRacesProps {
  races: HouseRace[];
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

type RatingTier = "Toss-up" | "Lean" | "Likely";

export default function HouseRaces({ races }: HouseRacesProps) {
  const [stateFilter, setStateFilter] = useState("");
  const [expandedRace, setExpandedRace] = useState<string | null>(null);

  const states = useMemo(() => {
    const s = [...new Set(races.map((r) => r.stateAbbr))].sort();
    return s;
  }, [races]);

  const filtered = useMemo(() => {
    if (!stateFilter) return races;
    return races.filter((r) => r.stateAbbr === stateFilter);
  }, [races, stateFilter]);

  const grouped = useMemo(() => {
    const tiers: Record<RatingTier, HouseRace[]> = {
      "Toss-up": [],
      Lean: [],
      Likely: [],
    };

    for (const race of filtered) {
      if (race.rating === "Toss-up") tiers["Toss-up"].push(race);
      else if (race.rating.startsWith("Lean")) tiers.Lean.push(race);
      else if (race.rating.startsWith("Likely")) tiers.Likely.push(race);
    }

    return tiers;
  }, [filtered]);

  const raceKey = (r: HouseRace) => `${r.stateAbbr}-${r.district}`;

  return (
    <div>
      {/* Filter bar */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            minWidth: 180,
          }}
        >
          <option value="">All States ({races.length} races)</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s} ({races.filter((r) => r.stateAbbr === s).length})
            </option>
          ))}
        </select>
        <span style={{ fontSize: 14, color: "#64748b" }}>
          {filtered.length} {filtered.length === 1 ? "race" : "races"} shown
        </span>
      </div>

      {/* Tier sections */}
      {(["Toss-up", "Lean", "Likely"] as RatingTier[]).map((tier) => {
        const tierRaces = grouped[tier];
        if (tierRaces.length === 0) return null;

        return (
          <div key={tier} style={{ marginBottom: 32 }}>
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
                  background:
                    tier === "Toss-up" ? "#d97706" : tier === "Lean" ? "#64748b" : "#94a3b8",
                }}
              />
              {tier === "Toss-up" ? "Toss-Up Races" : `${tier} Races`}
              <span style={{ fontSize: 14, fontWeight: 400, color: "#94a3b8" }}>
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
              {tierRaces.map((race) => {
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
                      padding: 16,
                      background: isExpanded ? "#f8fafc" : "#fff",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>
                          {race.stateAbbr}-{race.district}
                        </div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>{race.state}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
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

                    {/* Incumbent */}
                    {race.incumbent && (
                      <div style={{ marginTop: 8, fontSize: 13, color: "#475569" }}>
                        <span style={{ fontWeight: 600 }}>Incumbent:</span>{" "}
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

                    {/* Candidates summary */}
                    {(race.candidates.democrat.length > 0 || race.candidates.republican.length > 0) && (
                      <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
                        {race.candidates.democrat.length > 0 && (
                          <span style={{ color: PARTY_COLORS.Democrat }}>
                            {race.candidates.democrat.length}D
                          </span>
                        )}
                        {race.candidates.democrat.length > 0 && race.candidates.republican.length > 0 && " vs "}
                        {race.candidates.republican.length > 0 && (
                          <span style={{ color: PARTY_COLORS.Republican }}>
                            {race.candidates.republican.length}R
                          </span>
                        )}
                      </div>
                    )}

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
                        {race.whyCompetitive && (
                          <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, marginBottom: 8 }}>
                            {race.whyCompetitive}
                          </p>
                        )}

                        {race.primaryDate && (
                          <p style={{ fontSize: 12, color: "#94a3b8" }}>
                            Primary: {new Date(race.primaryDate).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        )}

                        {/* Candidate list */}
                        {[...race.candidates.democrat, ...race.candidates.republican, ...(race.candidates.independent ?? [])].map((c) => (
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
                              <span style={{ fontWeight: 600, color: PARTY_COLORS[c.party] ?? "#475569" }}>
                                {c.name}
                              </span>
                              {c.currentRole && (
                                <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.currentRole}</div>
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
              })}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <p style={{ fontSize: 14, color: "#94a3b8", textAlign: "center", padding: 32 }}>
          No competitive House races found{stateFilter ? ` in ${stateFilter}` : ""}.
        </p>
      )}
    </div>
  );
}
