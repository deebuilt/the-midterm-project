import { useState, useMemo } from "react";
import type { CongressMember } from "../../types";

interface ContactYourRepsProps {
  senators: CongressMember[];
}

const PARTY_COLORS: Record<string, string> = {
  Democrat: "#2563eb",
  Republican: "#dc2626",
  Independent: "#6d28d9",
};

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

export default function ContactYourReps({ senators }: ContactYourRepsProps) {
  const [selectedState, setSelectedState] = useState("");

  const states = useMemo(() => {
    const s = [...new Set(senators.map((m) => m.state))].sort();
    return s;
  }, [senators]);

  const stateSenators = useMemo(() => {
    if (!selectedState) return [];
    return senators
      .filter((m) => m.state === selectedState)
      .sort((a, b) => {
        // Senior senator first
        if (a.stateRank === "senior" && b.stateRank !== "senior") return -1;
        if (b.stateRank === "senior" && a.stateRank !== "senior") return 1;
        return a.name.localeCompare(b.name);
      });
  }, [senators, selectedState]);

  return (
    <div>
      {/* State picker */}
      <div style={{ marginBottom: 20 }}>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            minWidth: 240,
            background: "#fff",
          }}
        >
          <option value="">Select your state</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {STATE_NAMES[s] ?? s}
            </option>
          ))}
        </select>
      </div>

      {/* Senator cards */}
      {selectedState && stateSenators.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {stateSenators.map((sen) => (
            <div
              key={sen.bioguideId}
              style={{
                border: "1px solid #e2e8f0",
                borderLeft: `4px solid ${PARTY_COLORS[sen.party] ?? "#94a3b8"}`,
                borderRadius: 8,
                padding: 16,
                background: "#fff",
              }}
            >
              {/* Header with photo */}
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <img
                  src={sen.photoUrl}
                  alt={sen.name}
                  style={{
                    width: 64,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 6,
                    background: "#e2e8f0",
                  }}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: PARTY_COLORS[sen.party] ?? "#475569",
                    }}
                  >
                    {sen.name}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    {sen.party} &middot;{" "}
                    {sen.stateRank === "senior"
                      ? "Senior Senator"
                      : "Junior Senator"}
                  </div>
                  {sen.senateClass && (
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
                      Class {sen.senateClass}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact methods */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                {sen.phone && (
                  <a
                    href={`tel:${sen.phone}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#0f172a",
                      textDecoration: "none",
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: "#f8fafc",
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>&#128222;</span>
                    {sen.phone}
                  </a>
                )}

                {sen.website && (
                  <a
                    href={sen.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#2563eb",
                      textDecoration: "none",
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: "#f8fafc",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>&#127760;</span>
                    Official website
                  </a>
                )}

                {sen.contactFormUrl && (
                  <a
                    href={sen.contactFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#2563eb",
                      textDecoration: "none",
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: "#f8fafc",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>&#9993;</span>
                    Contact form
                  </a>
                )}

                {sen.twitter && (
                  <a
                    href={`https://x.com/${sen.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#475569",
                      textDecoration: "none",
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: "#f8fafc",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>&#120143;</span>
                    @{sen.twitter}
                  </a>
                )}

                {sen.office && (
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: "#f8fafc",
                      color: "#64748b",
                      fontSize: 12,
                      lineHeight: 1.4,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>&#127970;</span>{" "}
                    {sen.office}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedState && stateSenators.length === 0 && (
        <p style={{ fontSize: 14, color: "#94a3b8" }}>
          No senators found for {STATE_NAMES[selectedState] ?? selectedState}.
        </p>
      )}

      {!selectedState && (
        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 8 }}>
          Select your state to see your senators' phone numbers, websites, and
          contact forms.
        </p>
      )}
    </div>
  );
}
