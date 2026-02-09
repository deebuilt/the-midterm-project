import { useState, useEffect } from "react";

interface Phase {
  id: string;
  label: string;
  dateRange: string;
  description: string;
  explanation: string;
  endDate: Date;
  link?: { href: string; text: string };
}

const PHASES: Phase[] = [
  {
    id: "filing",
    label: "Filing Period",
    dateRange: "2025",
    description: "Candidates file paperwork to officially enter races across all 50 states.",
    explanation: "The filing period is when candidates officially declare their intent to run by submitting paperwork and filing fees with their state's election authority. Some states also require collecting voter signatures to appear on the ballot.",
    endDate: new Date("2026-03-02T23:59:59"),
  },
  {
    id: "primaries",
    label: "Primary Season",
    dateRange: "Mar \u2013 Sep 2026",
    description: "State-by-state primaries narrow each party's field to one nominee per race.",
    explanation: "A primary election is how each political party narrows its candidates to one nominee per race. Voters pick which candidate will represent that party in November. Some states limit voting to people registered with that party (closed primary), while others let any voter participate (open primary).",
    endDate: new Date("2026-09-15T23:59:59"),
    link: { href: "/calendar", text: "See primary dates" },
  },
  {
    id: "campaign",
    label: "General Campaign",
    dateRange: "Sep \u2013 Nov 2026",
    description: "Final nominees go head-to-head. Debates, ads, and the push to Election Day.",
    explanation: "After primaries determine each party's nominee, the general election campaign begins. Candidates debate, run ads, and make their case to all voters \u2014 not just their party. This is when most campaign spending happens and voters start paying close attention.",
    endDate: new Date("2026-11-02T23:59:59"),
  },
  {
    id: "election",
    label: "Election Day",
    dateRange: "Nov 3, 2026",
    description: "Polls open nationwide. 35 Senate seats, 435 House seats, and governors on the ballot.",
    explanation: "Election Day is when voters across the country cast their ballots. Polls are open from early morning to evening (hours vary by state). Many states also offer early voting and mail-in ballots in the weeks before. You vote at your assigned polling place based on your address.",
    endDate: new Date("2026-11-03T23:59:59"),
    link: { href: "/map", text: "Preview your ballot" },
  },
  {
    id: "results",
    label: "Results",
    dateRange: "Nov \u2013 Dec 2026",
    description: "Votes counted, winners declared. Runoffs held where needed (e.g., Georgia Dec 1).",
    explanation: "After polls close, votes are counted \u2014 sometimes taking days for close races or states with large mail-in vote shares. States then certify their results. If no candidate reaches the required threshold in some states (like Georgia), a runoff election is held weeks later.",
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
  slate50: "#F8FAFC",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  white: "#FFFFFF",
};

export default function ElectionTracker() {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  useEffect(() => {
    setCurrentIndex(getCurrentPhaseIndex());
  }, []);

  // Don't render until client-side hydration determines the phase
  if (currentIndex === -1) return null;

  return (
    <>
      {/* Desktop: horizontal stepper */}
      <div style={{ display: "none" }} className="md:!block">
        <DesktopStepper currentIndex={currentIndex} expandedPhase={expandedPhase} setExpandedPhase={setExpandedPhase} />
      </div>
      {/* Mobile: vertical stepper */}
      <div style={{ display: "block" }} className="md:!hidden">
        <MobileStepper currentIndex={currentIndex} expandedPhase={expandedPhase} setExpandedPhase={setExpandedPhase} />
      </div>
    </>
  );
}

interface StepperProps {
  currentIndex: number;
  expandedPhase: string | null;
  setExpandedPhase: (phase: string | null) => void;
}

function DesktopStepper({ currentIndex, expandedPhase, setExpandedPhase }: StepperProps) {
  const expandedIndex = expandedPhase ? PHASES.findIndex((p) => p.id === expandedPhase) : -1;
  const showExplanation = expandedPhase !== null && expandedIndex !== -1;

  return (
    <div>
      {/* Step circles + connecting lines */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {PHASES.map((phase, i) => {
          const isComplete = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isExpanded = phase.id === expandedPhase;

          return (
            <div key={phase.id} style={{ display: "contents" }}>
              {/* Circle */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                <div
                  role="button"
                  aria-expanded={isExpanded}
                  aria-label={`${phase.label}: tap to learn more`}
                  tabIndex={0}
                  onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpandedPhase(isExpanded ? null : phase.id);
                    }
                  }}
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
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    outline: "none",
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
                    ...(isExpanded && !isCurrent
                      ? { boxShadow: `0 0 0 3px ${COLORS.slate300}` }
                      : {}),
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
          const isExpanded = phase.id === expandedPhase;
          return (
            <div
              key={phase.id}
              style={{
                flex: 1,
                textAlign: "center",
                cursor: "pointer",
                ...(i === 0 ? { textAlign: "left" as const } : {}),
                ...(i === PHASES.length - 1 ? { textAlign: "right" as const } : {}),
              }}
              onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: isCurrent || isExpanded ? 700 : 500,
                  color: isCurrent || isExpanded ? COLORS.navy : COLORS.slate500,
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

      {/* Explanation card (when a non-current phase is tapped) */}
      {showExplanation && expandedIndex !== currentIndex && (
        <div
          style={{
            marginTop: 20,
            padding: "16px 20px",
            backgroundColor: COLORS.slate50,
            borderRadius: 8,
            borderLeft: `3px solid ${COLORS.navy}`,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.navy, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {PHASES[expandedIndex].label}
            </span>
            <span
              style={{ fontSize: 11, color: COLORS.slate400, cursor: "pointer" }}
              onClick={() => setExpandedPhase(null)}
            >
              &times; close
            </span>
          </div>
          <div style={{ fontSize: 14, color: COLORS.navy, lineHeight: 1.6 }}>
            {PHASES[expandedIndex].explanation}
          </div>
        </div>
      )}

      {/* Current phase detail card (when viewing the current phase or nothing expanded) */}
      {(!showExplanation || expandedIndex === currentIndex) && (
        <div
          style={{
            marginTop: 20,
            padding: "16px 20px",
            backgroundColor: expandedIndex === currentIndex ? COLORS.slate50 : COLORS.tossupLight,
            borderRadius: 8,
            borderLeft: `3px solid ${expandedIndex === currentIndex ? COLORS.navy : COLORS.tossup}`,
            display: "flex",
            alignItems: expandedIndex === currentIndex ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 16,
            flexDirection: expandedIndex === currentIndex ? "column" : "row",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: expandedIndex === currentIndex ? COLORS.navy : COLORS.tossup, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Current phase
              </span>
              {expandedIndex === currentIndex && (
                <span
                  style={{ fontSize: 11, color: COLORS.slate400, cursor: "pointer" }}
                  onClick={() => setExpandedPhase(null)}
                >
                  &times; close detail
                </span>
              )}
            </div>
            <div style={{ fontSize: 14, color: COLORS.navy, lineHeight: 1.5 }}>
              {expandedIndex === currentIndex
                ? PHASES[currentIndex].explanation
                : PHASES[currentIndex].description}
            </div>
          </div>
          {PHASES[currentIndex].link && expandedIndex !== currentIndex && (
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
          {PHASES[currentIndex].link && expandedIndex === currentIndex && (
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
                alignSelf: "flex-start",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(30,41,59,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              {PHASES[currentIndex].link!.text} &rarr;
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function MobileStepper({ currentIndex, expandedPhase, setExpandedPhase }: StepperProps) {
  return (
    <div>
      {PHASES.map((phase, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === PHASES.length - 1;
        const isExpanded = phase.id === expandedPhase;
        const showContent = isCurrent || isExpanded;

        return (
          <div key={phase.id} style={{ display: "flex", gap: 14 }}>
            {/* Left: circle + vertical line */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                role="button"
                aria-expanded={isExpanded}
                aria-label={`${phase.label}: tap to learn more`}
                tabIndex={0}
                onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedPhase(isExpanded ? null : phase.id);
                  }
                }}
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
                  cursor: "pointer",
                  outline: "none",
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
                  ...(isExpanded && !isCurrent
                    ? { boxShadow: `0 0 0 2px ${COLORS.slate300}` }
                    : {}),
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
              <div
                style={{ display: "flex", alignItems: "baseline", gap: 8, cursor: "pointer" }}
                onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: isCurrent || isExpanded ? 700 : 500,
                    color: isCurrent || isExpanded ? COLORS.navy : COLORS.slate500,
                  }}
                >
                  {phase.label}
                </span>
                <span style={{ fontSize: 11, color: COLORS.slate400 }}>
                  {phase.dateRange}
                </span>
              </div>
              {showContent && (
                <div style={{ marginTop: 6 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: COLORS.navy,
                      lineHeight: 1.5,
                      padding: "10px 14px",
                      backgroundColor: isCurrent && !isExpanded ? COLORS.tossupLight : COLORS.slate50,
                      borderRadius: 6,
                      borderLeft: `3px solid ${isCurrent && !isExpanded ? COLORS.tossup : COLORS.navy}`,
                    }}
                  >
                    {isExpanded ? phase.explanation : phase.description}
                    {phase.link && !isExpanded && (
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
                    {isExpanded && (
                      <span
                        style={{
                          display: "block",
                          marginTop: 8,
                          fontSize: 11,
                          color: COLORS.slate400,
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedPhase(null);
                        }}
                      >
                        Tap to close
                      </span>
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
