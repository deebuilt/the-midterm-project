import { useState, useRef, type TouchEvent, type MouseEvent } from "react";
import type { SwipeCard } from "../../types";

interface SwipeCardsProps {
  cards: SwipeCard[];
}

const partyColors = {
  Democrat: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    badge: "bg-blue-500",
    text: "text-blue-700",
  },
  Republican: {
    bg: "bg-red-50",
    border: "border-red-300",
    badge: "bg-red-500",
    text: "text-red-700",
  },
  Independent: {
    bg: "bg-purple-50",
    border: "border-purple-300",
    badge: "bg-purple-500",
    text: "text-purple-700",
  },
};

export default function SwipeCards({ cards }: SwipeCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const card = cards[currentIndex];
  const isFinished = currentIndex >= cards.length;

  function handleStart(clientX: number) {
    startX.current = clientX;
    setIsDragging(true);
  }

  function handleMove(clientX: number) {
    if (!isDragging) return;
    setOffset(clientX - startX.current);
  }

  function handleEnd() {
    setIsDragging(false);
    const threshold = 100;
    if (Math.abs(offset) > threshold) {
      setCurrentIndex((i) => i + 1);
    }
    setOffset(0);
  }

  function onTouchStart(e: TouchEvent) {
    handleStart(e.touches[0]!.clientX);
  }
  function onTouchMove(e: TouchEvent) {
    handleMove(e.touches[0]!.clientX);
  }
  function onMouseDown(e: MouseEvent) {
    handleStart(e.clientX);
  }
  function onMouseMove(e: MouseEvent) {
    handleMove(e.clientX);
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-4">&#127881;</div>
        <h2 className="text-2xl font-bold mb-2">You've seen them all!</h2>
        <p className="text-slate-500 mb-6">
          You've swiped through all the cards. Want to start over?
        </p>
        <button
          onClick={() => setCurrentIndex(0)}
          className="bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-colors"
        >
          Start Over
        </button>
      </div>
    );
  }

  const rotation = offset * 0.1;
  const opacity = 1 - Math.abs(offset) / 400;

  return (
    <div className="flex flex-col items-center">
      {/* Card counter */}
      <div className="text-sm text-slate-400 mb-4">
        {currentIndex + 1} / {cards.length}
      </div>

      {/* Card stack area */}
      <div className="relative w-full max-w-sm h-[75vh] max-h-[600px] min-h-[480px] select-none">
        {/* Next card (behind) */}
        {currentIndex + 1 < cards.length && (
          <div className="absolute inset-0 bg-white rounded-2xl shadow-md border border-slate-200 scale-95 opacity-60" />
        )}

        {/* Current card */}
        <div
          className="absolute inset-0 bg-white rounded-2xl shadow-lg border border-slate-200 cursor-grab active:cursor-grabbing overflow-hidden"
          style={{
            transform: `translateX(${offset}px) rotate(${rotation}deg)`,
            opacity,
            transition: isDragging ? "none" : "transform 0.3s, opacity 0.3s",
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={handleEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={handleEnd}
          onMouseLeave={() => {
            if (isDragging) handleEnd();
          }}
        >
          {card?.type === "candidate" && card.candidate && (
            <CandidateCard card={card} />
          )}
          {card?.type === "fact" && card.fact && <FactCard card={card} />}
        </div>

        {/* Swipe indicators */}
        {offset < -30 && (
          <div className="absolute top-6 right-6 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold rotate-12 pointer-events-none">
            NEXT
          </div>
        )}
        {offset > 30 && (
          <div className="absolute top-6 left-6 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold -rotate-12 pointer-events-none">
            NEXT
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          &#8592; Back
        </button>
        <button
          onClick={() => setCurrentIndex((i) => i + 1)}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700"
        >
          Next &#8594;
        </button>
      </div>
    </div>
  );
}

function CandidateCard({ card }: { card: SwipeCard }) {
  const candidate = card.candidate!;
  const race = card.race as import("../../types").SenateRace | undefined;
  const colors = partyColors[candidate.party];

  return (
    <div className={`h-full flex flex-col ${colors.bg}`}>
      {/* Photo */}
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center overflow-hidden">
        {candidate.photo && !candidate.photo.includes("/images/candidates/") ? (
          <img
            src={candidate.photo}
            alt={candidate.name}
            className="w-full h-full object-cover object-[center_25%]"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="text-5xl text-slate-400 flex items-center justify-center h-full">${candidate.name.split(" ").map((n) => n[0]).join("")}</div>`;
            }}
          />
        ) : (
          <div className="text-5xl text-slate-400">
            {candidate.name.split(" ").map((n) => n[0]).join("")}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${colors.badge}`}>
            {candidate.party}
          </span>
          {candidate.isIncumbent && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              Incumbent
            </span>
          )}
        </div>
        {candidate.website ? (
          <a
            href={candidate.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-bold mb-0.5 underline decoration-1 underline-offset-2 hover:decoration-2"
            onClick={(e) => e.stopPropagation()}
          >
            {candidate.name} &#8599;
          </a>
        ) : (
          <h3 className="text-lg font-bold mb-0.5">{candidate.name}</h3>
        )}
        {race && (
          <p className="text-xs text-slate-500 mb-1">
            {race.state} Senate {race.isSpecialElection ? "(Special)" : "2026"}
          </p>
        )}
        {candidate.currentRole && (
          <p className="text-xs text-slate-600 mb-1">{candidate.currentRole}</p>
        )}
        {candidate.twitter && (
          <a
            href={`https://x.com/${candidate.twitter}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-slate-600 mb-2 inline-block"
            onClick={(e) => e.stopPropagation()}
          >
            @{candidate.twitter}
          </a>
        )}

        {/* Show positions if available, otherwise show key issues */}
        {candidate.positions && candidate.positions.length > 0 ? (
          <ul className="space-y-1.5">
            {candidate.positions.slice(0, 3).map((position) => (
              <li key={position} className="text-xs text-slate-700 leading-snug flex gap-1.5">
                <span className="text-slate-400 shrink-0">&bull;</span>
                <span>{position}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {candidate.keyIssues.map((issue) => (
              <span
                key={issue}
                className={`text-xs px-2 py-1 rounded-full border ${colors.border} ${colors.text}`}
              >
                {issue}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Swipe hint */}
      <div className="text-center text-xs text-slate-400 pb-3">
        Swipe or use arrows below
      </div>
    </div>
  );
}

function FactCard({ card }: { card: SwipeCard }) {
  const fact = card.fact!;

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-amber-50 to-orange-50 text-center">
      <div className="text-4xl mb-4">&#128161;</div>
      <h3 className="text-xl font-bold mb-4">{fact.title}</h3>
      <p className="text-slate-600 leading-relaxed">{fact.content}</p>
      <div className="text-xs text-slate-400 mt-auto pt-8">
        Swipe or tap arrows to continue
      </div>
    </div>
  );
}
