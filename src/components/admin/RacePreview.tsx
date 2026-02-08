import { Tag } from "antd";

const RATING_COLORS: Record<string, string> = {
  "Safe D": "#1E40AF",
  "Likely D": "#3B82F6",
  "Lean D": "#93C5FD",
  "Toss-up": "#F59E0B",
  "Lean R": "#FCA5A5",
  "Likely R": "#EF4444",
  "Safe R": "#991B1B",
};

const RATING_TEXT_COLORS: Record<string, string> = {
  "Safe D": "#fff",
  "Likely D": "#fff",
  "Lean D": "#1E293B",
  "Toss-up": "#1E293B",
  "Lean R": "#1E293B",
  "Likely R": "#fff",
  "Safe R": "#fff",
};

const PARTY_COLORS: Record<string, string> = {
  Democrat: "#2563EB",
  Republican: "#DC2626",
  Independent: "#7C3AED",
  Libertarian: "#D97706",
  Green: "#16A34A",
};

interface PreviewCandidate {
  name: string;
  party: string;
  roleTitle: string | null;
  isIncumbent: boolean;
}

interface RacePreviewProps {
  state: string;
  stateAbbr: string;
  rating: string | null;
  isSpecialElection: boolean;
  isOpenSeat: boolean;
  whyCompetitive: string | null;
  candidates: PreviewCandidate[];
  senateClass?: number | null;
}

function getSectionLabel(
  rating: string | null,
  isSpecialElection: boolean,
  isOpenSeat: boolean
): string[] {
  const sections: string[] = [];
  if (rating === "Toss-up") sections.push("Toss-up Races");
  else if (rating === "Lean R" || rating === "Lean D") sections.push("Competitive Races");
  if (isSpecialElection) sections.push("Special Elections");
  if (isOpenSeat) sections.push("Senate Retirements");
  if (sections.length === 0) sections.push("All Seats table only");
  return sections;
}

export default function RacePreview({
  state,
  stateAbbr,
  rating,
  isSpecialElection,
  isOpenSeat,
  whyCompetitive,
  candidates,
  senateClass,
}: RacePreviewProps) {
  const dems = candidates.filter((c) => c.party === "Democrat");
  const reps = candidates.filter((c) => c.party === "Republican");
  const inds = candidates.filter(
    (c) => c.party !== "Democrat" && c.party !== "Republican"
  );
  const sections = getSectionLabel(rating, isSpecialElection, isOpenSeat);

  return (
    <div>
      {/* Card preview */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>
              {state} ({stateAbbr})
            </span>
            {senateClass && (
              <span
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  background: "#f3f4f6",
                  padding: "2px 8px",
                  borderRadius: 4,
                }}
              >
                Class {senateClass}
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {rating && (
              <span
                style={{
                  background: RATING_COLORS[rating] ?? "#6b7280",
                  color: RATING_TEXT_COLORS[rating] ?? "#fff",
                  padding: "2px 10px",
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {rating}
              </span>
            )}
            {isOpenSeat && (
              <span
                style={{
                  background: "#fef3c7",
                  color: "#92400e",
                  padding: "2px 10px",
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Open Seat
              </span>
            )}
            {isSpecialElection && (
              <span
                style={{
                  background: "#ede9fe",
                  color: "#5b21b6",
                  padding: "2px 10px",
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Special Election
              </span>
            )}
          </div>
        </div>

        {/* Candidates */}
        <div style={{ padding: "12px 20px" }}>
          {[
            { label: "Democrat", list: dems },
            { label: "Republican", list: reps },
            { label: "Independent / Other", list: inds },
          ]
            .filter((g) => g.list.length > 0)
            .map((group) => (
              <div key={group.label} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 4,
                  }}
                >
                  {group.label}
                </div>
                {group.list.map((c) => (
                  <div
                    key={c.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 0",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: PARTY_COLORS[c.party] ?? "#6b7280",
                      }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</span>
                    {c.isIncumbent && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "#16a34a",
                          fontWeight: 600,
                        }}
                      >
                        INCUMBENT
                      </span>
                    )}
                    {c.roleTitle && (
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>
                        {c.roleTitle}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}

          {candidates.length === 0 && (
            <span style={{ color: "#9ca3af", fontSize: 13 }}>
              No candidates assigned yet
            </span>
          )}
        </div>

        {/* Why competitive */}
        {whyCompetitive && (
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid #e5e7eb",
              background: "#f9fafb",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#6b7280",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Why Competitive
            </div>
            <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>
              {whyCompetitive}
            </p>
          </div>
        )}
      </div>

      {/* Section indicator */}
      <div
        style={{
          marginTop: 16,
          padding: "10px 14px",
          background: "#f0f9ff",
          borderRadius: 8,
          border: "1px solid #bae6fd",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 600, color: "#0369a1", marginBottom: 4 }}>
          Public Site Placement
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {sections.map((s) => (
            <Tag key={s} color="blue">
              {s}
            </Tag>
          ))}
        </div>
      </div>
    </div>
  );
}
