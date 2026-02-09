import { useState, useEffect } from "react";

interface Phase {
  id: string;
  label: string;
  dateRange: string;
  description: string;
  endDate: Date;
  link?: { href: string; text: string };
}

const PHASES: Phase[] = [
  {
    id: "filing",
    label: "Filing Period",
    dateRange: "2025",
    description: "Candidates file paperwork to officially enter races across all 50 states.",
    endDate: new Date("2026-03-02T23:59:59"),
  },
  {
    id: "primaries",
    label: "Primary Season",
    dateRange: "Mar – Sep 2026",
    description: "State-by-state primaries narrow each party's field to one nominee per race.",
    endDate: new Date("2026-09-15T23:59:59"),
    link: { href: "/calendar", text: "See primary dates" },
  },
  {
    id: "campaign",
    label: "General Campaign",
    dateRange: "Sep – Nov 2026",
    description: "Final nominees go head-to-head. Debates, ads, and the push to Election Day.",
    endDate: new Date("2026-11-02T23:59:59"),
  },
  {
    id: "election",
    label: "Election Day",
    dateRange: "Nov 3, 2026",
    description: "Polls open nationwide. 35 Senate seats, 435 House seats, and governors on the ballot.",
    endDate: new Date("2026-11-03T23:59:59"),
    link: { href: "/map", text: "Preview your ballot" },
  },
  {
    id: "results",
    label: "Results",
    dateRange: "Nov – Dec 2026",
    description: "Votes counted, winners declared. Runoffs held where needed (e.g., Georgia Dec 1).",
    endDate: new Date("2026-12-31T23:59:59"),
  },
];

function getCurrentPhaseIndex(): number {
  const now = new Date();
  for (let i = 0; i < PHASES.length; i++) {
    if (now <= PHASES[i].endDate) return i;
  }
  return PHASES.length - 1;
}

// Inline styles to avoid Tailwind class conflicts in React island
const COLORS = {
  navy: "#1E293B",
  tossup: "#F59E0B",
  tossupLight: "#FEF3C7",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  white: "#FFFFFF",
};

export default function ElectionTracker() {
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    setCurrentIndex(getCurrentPhaseIndex());
  }, []);

  // Don't render until client-side hydration determines the phase
  if (currentIndex === -1) return null;

  return (
    <>
      {/* Desktop: horizontal stepper */}
      <div style={{ display: "none" }} className="md:!block">
        <DesktopStepper currentIndex={currentIndex} />
      </div>
      {/* Mobile: vertical stepper */}
      <div style={{ display: "block" }} className="md:!hidden">
        <MobileStepper currentIndex={currentIndex} />
      </div>
    </>
  );
}

function DesktopStepper({ currentIndex }: { currentIndex: number }) {
  return (
    <div>
      {/* Step circles + connecting lines */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {PHASES.map((phase, i) => {
          const isComplete = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;

          return (
            <div key={phase.id} style={{ display: "contents" }}>
              {/* Circle */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    flexShrink: 0,
                    transition: "all 0.3s ease",
                    ...(isComplete
                      ? { backgroundColor: COLORS.navy, color: COLORS.white }
                      : isCurrent
                        ? {
                            backgroundColor: COLORS.tossup,
                            color: COLORS.white,
                            boxShadow: `0 0 0 4px ${COLORS.tossupLight}`,
                          }
                        : {
                            backgroundColor: COLORS.white,
                            color: COLORS.slate400,
                            border: `2px solid ${COLORS.slate300}`,
                          }),
                  }}
                >
                  {isComplete ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
              </div>

              {/* Connecting line (not after last) */}
              {i < PHASES.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: i < currentIndex ? COLORS.navy : COLORS.slate300,
                    ...(i >= currentIndex ? { backgroundImage: "none" } : {}),
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Labels row */}
      <div style={{ display: "flex", marginTop: 12 }}>
        {PHASES.map((phase, i) => {
          const isCurrent = i === currentIndex;
          return (
            <div
              key={phase.id}
              style={{
                flex: 1,
                textAlign: "center",
                ...(i === 0 ? { textAlign: "left" as const } : {}),
                ...(i === PHASES.length - 1 ? { textAlign: "right" as const } : {}),
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? COLORS.navy : COLORS.slate500,
                }}
              >
                {phase.label}
              </div>
              <div style={{ fontSize: 11, color: COLORS.slate400, marginTop: 2 }}>
                {phase.dateRange}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current phase detail card */}
      <div
        style={{
          marginTop: 20,
          padding: "16px 20px",
          backgroundColor: COLORS.tossupLight,
          borderRadius: 8,
          borderLeft: `3px solid ${COLORS.tossup}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.tossup, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Current phase
          </div>
          <div style={{ fontSize: 14, color: COLORS.navy, lineHeight: 1.5 }}>
            {PHASES[currentIndex].description}
          </div>
        </div>
        {PHASES[currentIndex].link && (
          <a
            href={PHASES[currentIndex].link!.href}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: COLORS.navy,
              textDecoration: "none",
              whiteSpace: "nowrap",
              padding: "6px 14px",
              borderRadius: 6,
              border: `1px solid ${COLORS.navy}`,
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(30,41,59,0.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            {PHASES[currentIndex].link!.text} &rarr;
          </a>
        )}
      </div>
    </div>
  );
}

function MobileStepper({ currentIndex }: { currentIndex: number }) {
  return (
    <div>
      {PHASES.map((phase, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === PHASES.length - 1;

        return (
          <div key={phase.id} style={{ display: "flex", gap: 14 }}>
            {/* Left: circle + vertical line */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                  ...(isComplete
                    ? { backgroundColor: COLORS.navy, color: COLORS.white }
                    : isCurrent
                      ? {
                          backgroundColor: COLORS.tossup,
                          color: COLORS.white,
                          boxShadow: `0 0 0 3px ${COLORS.tossupLight}`,
                        }
                      : {
                          backgroundColor: COLORS.white,
                          color: COLORS.slate400,
                          border: `2px solid ${COLORS.slate300}`,
                        }),
                }}
              >
                {isComplete ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 20,
                    backgroundColor: isComplete ? COLORS.navy : COLORS.slate300,
                  }}
                />
              )}
            </div>

            {/* Right: text */}
            <div style={{ paddingBottom: isLast ? 0 : 20, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? COLORS.navy : COLORS.slate500,
                  }}
                >
                  {phase.label}
                </span>
                <span style={{ fontSize: 11, color: COLORS.slate400 }}>
                  {phase.dateRange}
                </span>
              </div>
              {isCurrent && (
                <div style={{ marginTop: 6 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: COLORS.navy,
                      lineHeight: 1.5,
                      padding: "10px 14px",
                      backgroundColor: COLORS.tossupLight,
                      borderRadius: 6,
                      borderLeft: `3px solid ${COLORS.tossup}`,
                    }}
                  >
                    {phase.description}
                    {phase.link && (
                      <a
                        href={phase.link.href}
                        style={{
                          display: "inline-block",
                          marginLeft: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          color: COLORS.tossup,
                          textDecoration: "none",
                        }}
                      >
                        {phase.link.text} &rarr;
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
