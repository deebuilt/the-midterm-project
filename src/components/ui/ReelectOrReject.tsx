import { useState, useEffect, useCallback, useRef } from "react";
import type { IncumbentCard, SwipeChoice, SwipeResult, VotingRecord } from "../../types";

const STORAGE_KEY = "reelect-or-reject-choices";

interface Props {
  incumbents: IncumbentCard[];
}

function loadChoices(): Record<string, SwipeChoice> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveChoices(choices: Record<string, SwipeChoice>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(choices));
}

// ─── Vote Badge ───

function VoteBadge({ vote }: { vote: VotingRecord["vote"] }) {
  const styles: Record<string, string> = {
    yea: "bg-green-100 text-green-700",
    nay: "bg-red-100 text-red-700",
    abstain: "bg-gray-100 text-gray-600",
    not_voting: "bg-slate-100 text-slate-500",
  };
  const labels: Record<string, string> = {
    yea: "YEA",
    nay: "NAY",
    abstain: "ABSTAIN",
    not_voting: "NOT VOTING",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles[vote] ?? ""}`}>
      {labels[vote] ?? vote}
    </span>
  );
}

// ─── External Link Icon ───

function ExternalLinkIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

// ─── Card Content ───

function CardContent({
  incumbent,
  photoRef,
}: {
  incumbent: IncumbentCard;
  photoRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const partyColors: Record<string, string> = {
    Democrat: "bg-blue-100 text-blue-700",
    Republican: "bg-red-100 text-red-700",
    Independent: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Photo — 3:2 ratio, center on face */}
      <div
        ref={photoRef}
        className="w-full aspect-[3/2] bg-slate-100 rounded-t-2xl overflow-hidden relative"
      >
        {incumbent.photo ? (
          <img
            src={incumbent.photo}
            alt={incumbent.name}
            className="w-full h-full object-cover object-[center_20%]"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
        {/* Tap hint overlay */}
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 pointer-events-none">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tap for details
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex-1">
        {incumbent.website ? (
          <a
            href={incumbent.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl font-bold text-slate-900 hover:text-blue-700 inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {incumbent.name}
            <ExternalLinkIcon className="w-4 h-4 shrink-0" />
          </a>
        ) : (
          <h2 className="text-xl font-bold text-slate-900">{incumbent.name}</h2>
        )}
        <p className="text-sm text-slate-500 mt-0.5">
          {incumbent.state} &middot; {incumbent.memberTitle}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${partyColors[incumbent.party] ?? ""}`}>
            {incumbent.party}
          </span>
          {incumbent.isRetiring && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
              Retiring
            </span>
          )}
          {incumbent.isSpecialElection && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700">
              Special Election
            </span>
          )}
          {incumbent.rating && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {incumbent.rating}
            </span>
          )}
        </div>

        {/* Votes hint (if they have voting records) */}
        {incumbent.votes.length > 0 && (
          <p className="text-xs text-slate-400 mt-3 italic">
            {incumbent.votes.length} voting record{incumbent.votes.length !== 1 ? "s" : ""} — tap photo for details
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Senator Detail Bottom Sheet ───

function SenatorDetailSheet({
  incumbent,
  isOpen,
  onClose,
}: {
  incumbent: IncumbentCard | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  const partyColors: Record<string, string> = {
    Democrat: "bg-blue-100 text-blue-700",
    Republican: "bg-red-100 text-red-700",
    Independent: "bg-purple-100 text-purple-700",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[54] bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`
          fixed inset-x-0 bottom-0 z-[55] bg-white rounded-t-2xl shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-y-0" : "translate-y-full"}
        `}
        style={{ maxHeight: "70vh" }}
        role="dialog"
        aria-modal="true"
        aria-label={incumbent ? `Details for ${incumbent.name}` : undefined}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {incumbent && (
          <div className="overflow-y-auto px-5 pb-6" style={{ maxHeight: "calc(70vh - 20px)" }}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                {incumbent.website ? (
                  <a
                    href={incumbent.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-bold text-slate-900 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    {incumbent.name}
                    <ExternalLinkIcon className="w-4 h-4 shrink-0" />
                  </a>
                ) : (
                  <h3 className="text-lg font-bold text-slate-900">{incumbent.name}</h3>
                )}
                <p className="text-sm text-slate-500">
                  {incumbent.state} &middot; {incumbent.memberTitle}
                </p>
                <div className="flex gap-1.5 mt-1">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${partyColors[incumbent.party] ?? ""}`}>
                    {incumbent.party}
                  </span>
                  {incumbent.rating && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {incumbent.rating}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0 ml-3"
                aria-label="Close details"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Voting Records */}
            {incumbent.votes.length > 0 ? (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">
                  How They Voted ({incumbent.votes.length})
                  {incumbent.govtrackUrl && (
                    <>
                      {" · "}
                      <a
                        href={incumbent.govtrackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-normal text-slate-400 hover:text-blue-700 underline decoration-1 underline-offset-2 inline-flex items-center gap-1"
                      >
                        view key votes
                        <ExternalLinkIcon className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </h4>
                <div className="space-y-2.5">
                  {incumbent.votes.map((v) => (
                    <div key={v.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-slate-800 leading-tight">
                          {v.sourceUrl ? (
                            <a
                              href={v.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-700 underline decoration-1 underline-offset-2 inline-flex items-center gap-1"
                            >
                              {v.billName}
                              <ExternalLinkIcon className="w-3 h-3 shrink-0 inline" />
                            </a>
                          ) : (
                            v.billName
                          )}
                          {v.billNumber && (
                            <span className="text-slate-400 font-normal ml-1">({v.billNumber})</span>
                          )}
                        </div>
                        <VoteBadge vote={v.vote} />
                      </div>
                      {v.summary && (
                        <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{v.summary}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        {v.result && <span className="font-medium">{v.result}</span>}
                        {v.topic && <span>{v.topic}</span>}
                        {v.voteDate && <span>{new Date(v.voteDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : incumbent.govtrackUrl ? (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">How They Voted</h4>
                <p className="text-sm text-slate-400">
                  No voting records here yet.{" "}
                  <a
                    href={incumbent.govtrackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-blue-700 underline decoration-1 underline-offset-2 inline-flex items-center gap-1"
                  >
                    View key votes on GovTrack
                    <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">
                No voting records available yet.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Swipeable Card ───

function SwipeableCard({
  incumbent,
  onSwipe,
  isTop,
  onPhotoTap,
  isSheetOpen,
}: {
  incumbent: IncumbentCard;
  onSwipe: (choice: SwipeChoice) => void;
  isTop: boolean;
  onPhotoTap: (incumbent: IncumbentCard) => void;
  isSheetOpen: boolean;
}) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exiting, setExiting] = useState<SwipeChoice | null>(null);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const tapStartPos = useRef<{ x: number; y: number } | null>(null);
  const tapStartTime = useRef(0);

  const handleSwipe = useCallback(
    (choice: SwipeChoice) => {
      setExiting(choice);
      setTimeout(() => onSwipe(choice), 300);
    },
    [onSwipe]
  );

  // Keyboard controls (suppressed when bottom sheet is open)
  useEffect(() => {
    if (!isTop || isSheetOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handleSwipe("reject");
      if (e.key === "ArrowRight") handleSwipe("reelect");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isTop, isSheetOpen, handleSwipe]);

  const isTap = (endX: number, endY: number): boolean => {
    if (!tapStartPos.current) return false;
    const dx = Math.abs(endX - tapStartPos.current.x);
    const dy = Math.abs(endY - tapStartPos.current.y);
    const elapsed = Date.now() - tapStartTime.current;
    return dx < 10 && dy < 10 && elapsed < 300;
  };

  const isOnPhoto = (target: EventTarget): boolean => {
    return photoRef.current?.contains(target as Node) ?? false;
  };

  // Mouse drag
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    setIsDragging(true);
    startX.current = e.clientX;
    tapStartPos.current = { x: e.clientX, y: e.clientY };
    tapStartTime.current = Date.now();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset(e.clientX - startX.current);
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (exiting) return;
    if (!isDragging) return;
    setIsDragging(false);
    if (isTap(e.clientX, e.clientY) && isOnPhoto(e.target)) {
      setOffset(0);
      onPhotoTap(incumbent);
      return;
    }
    if (offset > 100) handleSwipe("reelect");
    else if (offset < -100) handleSwipe("reject");
    else setOffset(0);
  };

  // Touch drag
  const onTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
    tapStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    tapStartTime.current = Date.now();
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setOffset(e.touches[0].clientX - startX.current);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (exiting) return;
    if (!isDragging) return;
    setIsDragging(false);
    const touch = e.changedTouches[0];
    if (isTap(touch.clientX, touch.clientY) && isOnPhoto(e.target)) {
      setOffset(0);
      onPhotoTap(incumbent);
      return;
    }
    if (offset > 100) handleSwipe("reelect");
    else if (offset < -100) handleSwipe("reject");
    else setOffset(0);
  };

  const reelectOpacity = Math.min(Math.max(offset / 100, 0), 1);
  const rejectOpacity = Math.min(Math.max(-offset / 100, 0), 1);
  const rotation = offset * 0.1;

  let exitTransform = "";
  if (exiting === "reelect") exitTransform = "translateX(150%) rotate(30deg)";
  else if (exiting === "reject") exitTransform = "translateX(-150%) rotate(-30deg)";

  return (
    <div
      ref={cardRef}
      className={`absolute inset-0 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden cursor-grab active:cursor-grabbing select-none ${
        exiting ? "transition-transform duration-300" : isDragging ? "" : "transition-transform duration-200"
      }`}
      style={{
        transform: exiting
          ? exitTransform
          : `translateX(${offset}px) rotate(${rotation}deg)`,
        opacity: exiting ? 0 : 1,
        zIndex: isTop ? 10 : 5,
        ...(exiting ? { transition: "transform 300ms ease-out, opacity 300ms ease-out" } : {}),
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={() => {
        if (isDragging) {
          setIsDragging(false);
          setOffset(0);
        }
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <CardContent incumbent={incumbent} photoRef={photoRef} />

      {/* RE-ELECT overlay */}
      <div
        className="absolute top-8 left-4 pointer-events-none"
        style={{ opacity: reelectOpacity }}
      >
        <div className="border-4 border-green-500 text-green-500 font-black text-3xl px-4 py-2 rounded-lg -rotate-12">
          RE-ELECT
        </div>
      </div>

      {/* REJECT overlay */}
      <div
        className="absolute top-8 right-4 pointer-events-none"
        style={{ opacity: rejectOpacity }}
      >
        <div className="border-4 border-red-500 text-red-500 font-black text-3xl px-4 py-2 rounded-lg rotate-12">
          REJECT
        </div>
      </div>
    </div>
  );
}

// ─── Results Summary ───

function ResultsSummary({
  results,
  incumbents,
  onStartOver,
}: {
  results: Record<string, SwipeChoice>;
  incumbents: IncumbentCard[];
  onStartOver: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const reelectCount = Object.values(results).filter((c) => c === "reelect").length;
  const rejectCount = Object.values(results).filter((c) => c === "reject").length;

  // Party breakdown
  const partyStats = { Democrat: { reelect: 0, reject: 0 }, Republican: { reelect: 0, reject: 0 }, Independent: { reelect: 0, reject: 0 } };
  for (const inc of incumbents) {
    const choice = results[inc.id];
    if (choice && partyStats[inc.party]) {
      partyStats[inc.party][choice]++;
    }
  }

  const shareText = `My 2026 Senate Scorecard:
Re-elect: ${reelectCount} | Reject: ${rejectCount}
Democrats: ${partyStats.Democrat.reelect}/${partyStats.Democrat.reject} | Republicans: ${partyStats.Republican.reelect}/${partyStats.Republican.reject}

Take the quiz: https://themidtermproject.com/reelect-or-reject`;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text approach
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-black text-slate-900 mb-1">Your Scorecard</h2>
      <p className="text-slate-500 text-sm mb-6">All {incumbents.length} Senate seats</p>

      {/* Big numbers */}
      <div className="flex justify-center gap-8 mb-6">
        <div>
          <div className="text-4xl font-black text-green-600">{reelectCount}</div>
          <div className="text-sm font-medium text-slate-500">Re-elect</div>
        </div>
        <div className="w-px bg-slate-200" />
        <div>
          <div className="text-4xl font-black text-red-600">{rejectCount}</div>
          <div className="text-sm font-medium text-slate-500">Reject</div>
        </div>
      </div>

      {/* Party breakdown */}
      <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm">
        <div className="flex justify-between mb-2">
          <span className="font-medium text-blue-700">Democrats</span>
          <span>{partyStats.Democrat.reelect} re-elect / {partyStats.Democrat.reject} reject</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-red-700">Republicans</span>
          <span>{partyStats.Republican.reelect} re-elect / {partyStats.Republican.reject} reject</span>
        </div>
        {(partyStats.Independent.reelect + partyStats.Independent.reject > 0) && (
          <div className="flex justify-between mt-2">
            <span className="font-medium text-purple-700">Independent</span>
            <span>{partyStats.Independent.reelect} re-elect / {partyStats.Independent.reject} reject</span>
          </div>
        )}
      </div>

      {/* All choices list */}
      <div className="max-h-[300px] overflow-y-auto mb-6 text-left">
        {incumbents.map((inc) => {
          const choice = results[inc.id];
          const partyColor = inc.party === "Democrat" ? "text-blue-600" : inc.party === "Republican" ? "text-red-600" : "text-purple-600";
          return (
            <div key={inc.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <span className="font-medium text-slate-800">{inc.name}</span>
                <span className={`text-xs ml-1.5 ${partyColor}`}>({inc.stateAbbr})</span>
              </div>
              {choice === "reelect" ? (
                <span className="text-green-600 font-bold text-sm">&#10003; Re-elect</span>
              ) : (
                <span className="text-red-600 font-bold text-sm">&#10005; Reject</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleShare}
          className="flex-1 bg-slate-900 text-white font-semibold py-3 px-4 rounded-xl hover:bg-slate-800 transition-colors"
        >
          {copied ? "Copied!" : "Share Scorecard"}
        </button>
        <button
          onClick={onStartOver}
          className="flex-1 bg-slate-100 text-slate-700 font-semibold py-3 px-4 rounded-xl hover:bg-slate-200 transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───

export default function ReelectOrReject({ incumbents }: Props) {
  const [choices, setChoices] = useState<Record<string, SwipeChoice>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [detailIncumbent, setDetailIncumbent] = useState<IncumbentCard | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Load saved choices on mount
  useEffect(() => {
    const saved = loadChoices();
    setChoices(saved);
    // Resume where user left off
    const completedCount = incumbents.filter((inc) => saved[inc.id]).length;
    setCurrentIndex(completedCount);
    setLoaded(true);
  }, [incumbents]);

  const handlePhotoTap = useCallback((incumbent: IncumbentCard) => {
    setDetailIncumbent(incumbent);
    setIsSheetOpen(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setIsSheetOpen(false);
  }, []);

  const handleSwipe = useCallback(
    (choice: SwipeChoice) => {
      const incumbent = incumbents[currentIndex];
      if (!incumbent) return;
      setIsSheetOpen(false);
      const updated = { ...choices, [incumbent.id]: choice };
      setChoices(updated);
      saveChoices(updated);
      setCurrentIndex((prev) => prev + 1);
    },
    [choices, currentIndex, incumbents]
  );

  const handleUndo = useCallback(() => {
    if (currentIndex === 0) return;
    setIsSheetOpen(false);
    const prevIndex = currentIndex - 1;
    const prevIncumbent = incumbents[prevIndex];
    if (!prevIncumbent) return;
    const updated = { ...choices };
    delete updated[prevIncumbent.id];
    setChoices(updated);
    saveChoices(updated);
    setCurrentIndex(prevIndex);
  }, [choices, currentIndex, incumbents]);

  const handleStartOver = () => {
    localStorage.removeItem(STORAGE_KEY);
    setChoices({});
    setCurrentIndex(0);
  };

  if (!loaded) return null;

  const isFinished = currentIndex >= incumbents.length;

  if (incumbents.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>No incumbents to show. Check back later.</p>
      </div>
    );
  }

  return (
    <div>
      {!isFinished ? (
        <>
          {/* Progress */}
          <div className="text-center mb-4">
            <span className="text-sm font-medium text-slate-500">
              {currentIndex + 1} of {incumbents.length}
            </span>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
              <div
                className="bg-slate-800 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / incumbents.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Card Stack */}
          <div className="relative" style={{ height: "480px" }}>
            {/* Next card (peeking behind) */}
            {currentIndex + 1 < incumbents.length && (
              <div className="absolute inset-0 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden scale-[0.95] opacity-60">
                <CardContent incumbent={incumbents[currentIndex + 1]} />
              </div>
            )}
            {/* Current card */}
            <SwipeableCard
              key={incumbents[currentIndex].id}
              incumbent={incumbents[currentIndex]}
              onSwipe={handleSwipe}
              isTop
              onPhotoTap={handlePhotoTap}
              isSheetOpen={isSheetOpen}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => handleSwipe("reject")}
              className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center hover:bg-red-100 hover:border-red-300 transition-colors"
              aria-label="Reject"
            >
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={handleUndo}
              disabled={currentIndex === 0}
              className="w-11 h-11 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center hover:bg-slate-100 hover:border-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Undo"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
              </svg>
            </button>
            <button
              onClick={() => handleSwipe("reelect")}
              className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center hover:bg-green-100 hover:border-green-300 transition-colors"
              aria-label="Re-elect"
            >
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">
            Swipe or use arrow keys &middot; &larr; Reject &middot; Re-elect &rarr;
          </p>
        </>
      ) : (
        <ResultsSummary results={choices} incumbents={incumbents} onStartOver={handleStartOver} />
      )}

      {/* Senator Detail Bottom Sheet */}
      <SenatorDetailSheet
        incumbent={detailIncumbent}
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
      />
    </div>
  );
}
