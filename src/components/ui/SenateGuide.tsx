import { useState, useEffect, useRef, type TouchEvent } from "react";

// --- Types ---

interface SenateGuideProps {
  overview: {
    totalSeats: number;
    seatsUpForElection: number;
    specialElections: number;
    currentSplit: { republican: number; democrat: number };
    majorityNeeded: number;
    demsNeedToFlip: number;
    gopsCanLose: number;
    classUp: number;
    classBreakdown: { republican: number; democrat: number };
  };
}

const STEPS = [
  { id: "big-picture", title: "The Big Picture", short: "100 Seats" },
  { id: "regular-special", title: "Regular vs Special", short: "Why Special?" },
  { id: "current-score", title: "The Current Score", short: "The Math" },
  { id: "ratings", title: "Race Ratings Explained", short: "Ratings" },
];

// --- Main Component ---

export default function SenateGuide(props: SenateGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  // Body scroll lock + keyboard
  useEffect(() => {
    if (!isOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        setStep(0);
      }
      if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, STEPS.length - 1));
      if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  // Scroll content to top on step change
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
  }, [step]);

  // Swipe handling for mobile
  function onTouchStart(e: TouchEvent) {
    touchStartX.current = e.touches[0]!.clientX;
  }
  function onTouchEnd(e: TouchEvent) {
    const diff = e.changedTouches[0]!.clientX - touchStartX.current;
    if (Math.abs(diff) > 80) {
      if (diff < 0) setStep((s) => Math.min(s + 1, STEPS.length - 1));
      else setStep((s) => Math.max(s - 1, 0));
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-5 text-left transition-colors group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-tossup/20 text-tossup flex items-center justify-center text-lg font-bold shrink-0">
            ?
          </span>
          <div className="flex-1">
            <div className="font-bold text-slate-800 group-hover:text-tossup transition-colors">
              New to Senate elections?
            </div>
            <div className="text-sm text-slate-500">
              Take a 2-minute walkthrough of how Senate races work.
            </div>
          </div>
          <span className="text-slate-400 group-hover:text-tossup transition-colors text-xl">
            &rarr;
          </span>
        </div>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center"
      onClick={() => { setIsOpen(false); setStep(0); }}
    >
      <div
        className="bg-white w-full h-full md:max-w-2xl md:max-h-[85vh] md:rounded-2xl md:h-auto md:my-auto flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
          <div>
            <div className="text-xs text-slate-400 font-medium">
              Step {step + 1} of {STEPS.length}
            </div>
            <h2 className="text-lg font-bold">{STEPS[step]!.title}</h2>
          </div>
          <button
            onClick={() => { setIsOpen(false); setStep(0); }}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close guide"
          >
            &#10005;
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 py-2 shrink-0">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-6 bg-tossup"
                  : i < step
                    ? "w-2 bg-slate-400"
                    : "w-2 bg-slate-200"
              }`}
              aria-label={`Go to step ${i + 1}: ${s.title}`}
            />
          ))}
        </div>

        {/* Content area */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-5 pb-4"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {step === 0 && <BigPictureStep overview={props.overview} />}
          {step === 1 && <RegularVsSpecialStep overview={props.overview} />}
          {step === 2 && <CurrentScoreStep overview={props.overview} />}
          {step === 3 && <RatingsExplainedStep />}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            &larr; Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              Next &rarr;
            </button>
          ) : (
            <button
              onClick={() => {
                setIsOpen(false);
                setStep(0);
                window.location.href = "/map";
              }}
              className="px-5 py-2 rounded-lg bg-tossup text-white text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              Explore the Map &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Step 1: The Big Picture ---

function BigPictureStep({ overview }: { overview: SenateGuideProps["overview"] }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Build 100 dots: Class I (33), Class II (33), Class III (34)
  const classIDots = 33;
  const classIIDots = overview.seatsUpForElection; // 33
  const classIIIDots = 100 - classIDots - classIIDots; // 34

  const classIIRep = overview.classBreakdown.republican; // 20
  const classIIDem = overview.classBreakdown.democrat; // 13

  return (
    <div className="space-y-5 pt-2">
      <p className="text-sm text-slate-600 leading-relaxed">
        The U.S. Senate has <strong>100 seats</strong> &mdash; 2 per state. They're split into
        3 groups called <strong>classes</strong>. Each class comes up for election every 6 years,
        on a rotating schedule.
      </p>

      {/* Dot grid */}
      <div className="space-y-4">
        {/* Class I */}
        <div>
          <div className="text-xs font-medium text-slate-400 mb-1.5">
            Class I &middot; {classIDots} seats &middot; <span className="text-slate-300">Not up (last elected 2024)</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: classIDots }).map((_, i) => (
              <div
                key={`c1-${i}`}
                className="w-3 h-3 rounded-full bg-slate-200 transition-all duration-500"
                style={{
                  opacity: animate ? 1 : 0,
                  transform: animate ? "scale(1)" : "scale(0)",
                  transitionDelay: `${i * 12}ms`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Class II - HIGHLIGHTED */}
        <div className="bg-tossup/5 border border-tossup/20 rounded-lg p-3 -mx-1">
          <div className="text-xs font-bold text-tossup mb-1.5">
            Class II &middot; {classIIDots} seats &middot; UP IN 2026!
          </div>
          <div className="flex flex-wrap gap-1">
            {/* Republican seats */}
            {Array.from({ length: classIIRep }).map((_, i) => (
              <div
                key={`c2r-${i}`}
                className="w-3 h-3 rounded-full bg-red-400 ring-1 ring-red-300 transition-all duration-500"
                style={{
                  opacity: animate ? 1 : 0,
                  transform: animate ? "scale(1)" : "scale(0)",
                  transitionDelay: `${(classIDots + i) * 12}ms`,
                }}
                title="Republican-held seat"
              />
            ))}
            {/* Democrat seats */}
            {Array.from({ length: classIIDem }).map((_, i) => (
              <div
                key={`c2d-${i}`}
                className="w-3 h-3 rounded-full bg-blue-400 ring-1 ring-blue-300 transition-all duration-500"
                style={{
                  opacity: animate ? 1 : 0,
                  transform: animate ? "scale(1)" : "scale(0)",
                  transitionDelay: `${(classIDots + classIIRep + i) * 12}ms`,
                }}
                title="Democrat-held seat"
              />
            ))}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400" /> {classIIRep} Republican
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400" /> {classIIDem} Democrat
            </span>
          </div>
        </div>

        {/* Class III */}
        <div>
          <div className="text-xs font-medium text-slate-400 mb-1.5">
            Class III &middot; {classIIIDots} seats &middot; <span className="text-slate-300">Not up (next in 2028)</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: classIIIDots }).map((_, i) => (
              <div
                key={`c3-${i}`}
                className="w-3 h-3 rounded-full bg-slate-200 transition-all duration-500"
                style={{
                  opacity: animate ? 1 : 0,
                  transform: animate ? "scale(1)" : "scale(0)",
                  transitionDelay: `${(classIDots + classIIDots + i) * 12}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Plus specials */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm">
        <strong className="text-purple-700">+ {overview.specialElections} special elections</strong>
        <p className="text-slate-600 mt-1">
          Two senators left early (JD Vance became VP, Marco Rubio became Secretary of State).
          Their seats &mdash; which are actually <em>Class III</em> &mdash; get added to the
          2026 ballot as special elections.
        </p>
        <p className="text-slate-500 mt-2 text-xs">
          Total races in 2026: <strong>{overview.seatsUpForElection} regular + {overview.specialElections} special = {overview.seatsUpForElection + overview.specialElections}</strong>
        </p>
      </div>
    </div>
  );
}

// --- Step 2: Regular vs Special ---

function RegularVsSpecialStep({ overview }: { overview: SenateGuideProps["overview"] }) {
  return (
    <div className="space-y-4 pt-2">
      <p className="text-sm text-slate-600 leading-relaxed">
        Not all elections on the ballot happen for the same reason. Here's the difference:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Regular */}
        <div className="border border-slate-200 rounded-xl p-4">
          <div className="text-2xl mb-2">&#128197;</div>
          <h3 className="font-bold text-sm mb-1">Regular Election</h3>
          <p className="text-xs text-slate-500 mb-3">
            Scheduled every 6 years. The seat's term is expiring on time.
          </p>
          <div className="bg-slate-50 rounded-lg p-3 text-xs">
            <div className="font-semibold text-slate-700">Example:</div>
            <div className="text-slate-600 mt-1">
              A senator elected in 2020 serves until January 2027.
              Their seat appears on the 2026 ballot on schedule.
            </div>
          </div>
        </div>

        {/* Open Seat */}
        <div className="border border-tossup/30 rounded-xl p-4 bg-amber-50/20">
          <div className="text-2xl mb-2">&#128682;</div>
          <h3 className="font-bold text-sm mb-1">Open Seat</h3>
          <p className="text-xs text-slate-500 mb-3">
            Still on schedule, but the incumbent chose not to run again (retiring).
          </p>
          <div className="bg-white/70 rounded-lg p-3 text-xs">
            <div className="font-semibold text-slate-700">Why it matters:</div>
            <div className="text-slate-600 mt-1">
              Without an incumbent on the ballot, open seats are often
              more competitive. New candidates from both parties compete for it.
            </div>
          </div>
        </div>

        {/* Special */}
        <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/30">
          <div className="text-2xl mb-2">&#9889;</div>
          <h3 className="font-bold text-sm mb-1">Special Election</h3>
          <p className="text-xs text-slate-500 mb-3">
            Unplanned. The senator left early. Can be from <em>any</em> class.
          </p>
          <div className="bg-white/70 rounded-lg p-3 text-xs">
            <div className="font-semibold text-slate-700">In 2026:</div>
            <div className="text-slate-600 mt-1">
              {overview.specialElections} special elections &mdash; seats vacated when senators
              took other government positions. These are Class III seats appearing
              on the 2026 ballot early.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-600">
        <strong className="text-slate-700">Key insight:</strong> Special elections happen because
        a senator left for another job, passed away, or resigned. The state holds an election
        to fill the remainder of that term. These seats would normally be up in a different year.
      </div>
    </div>
  );
}

// --- Step 3: The Current Score ---

function CurrentScoreStep({ overview }: { overview: SenateGuideProps["overview"] }) {
  const [barAnimate, setBarAnimate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBarAnimate(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-5 pt-2">
      <p className="text-sm text-slate-600 leading-relaxed">
        Right now, Republicans control the Senate <strong>{overview.currentSplit.republican}-{overview.currentSplit.democrat}</strong>.
        You need <strong>{overview.majorityNeeded}</strong> seats for a majority.
      </p>

      {/* Bar */}
      <div className="relative">
        <div className="flex rounded-full overflow-hidden h-10">
          <div
            className="bg-red-500 flex items-center justify-center text-white text-sm font-bold transition-all duration-1000 ease-out"
            style={{ width: barAnimate ? `${overview.currentSplit.republican}%` : "0%" }}
          >
            {overview.currentSplit.republican} R
          </div>
          <div
            className="bg-blue-500 flex items-center justify-center text-white text-sm font-bold transition-all duration-1000 ease-out"
            style={{ width: barAnimate ? `${overview.currentSplit.democrat}%` : "0%" }}
          >
            {overview.currentSplit.democrat} D
          </div>
        </div>
        {/* 51 line */}
        <div
          className="absolute top-0 bottom-0 border-l-2 border-dashed border-slate-800"
          style={{ left: "51%" }}
        >
          <span className="absolute -top-5 -translate-x-1/2 text-xs font-bold text-slate-700 whitespace-nowrap">
            51 = majority
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center text-sm">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">{overview.demsNeedToFlip}</div>
          <div className="text-slate-500 text-xs">seats Dems must flip</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-600">{overview.gopsCanLose}</div>
          <div className="text-slate-500 text-xs">max seats GOP can lose</div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="text-sm font-bold mb-2">How do flips happen?</h3>
        <p className="text-sm text-slate-600">
          Of the {overview.seatsUpForElection} Class II seats up this cycle,{" "}
          <strong>{overview.classBreakdown.republican} are Republican-held</strong> and{" "}
          <strong>{overview.classBreakdown.democrat} are Democrat-held</strong>.
          Democrats need to flip {overview.demsNeedToFlip} seats while defending all of theirs.
          The most likely flips come from Toss-up and Lean-rated races.
        </p>
        <a href="/map" className="text-sm text-tossup font-medium mt-2 inline-block hover:underline">
          See which states are competitive on the map &rarr;
        </a>
      </div>
    </div>
  );
}

// --- Step 4: Race Ratings Explained ---

const RATINGS_ORDER = ["Safe D", "Likely D", "Lean D", "Toss-up", "Lean R", "Likely R", "Safe R"] as const;

const RATING_INFO: Record<string, { meaning: string; color: string; bgColor: string }> = {
  "Safe D":   { meaning: "Democrat is almost certain to win. Deep blue state, strong incumbent.", color: "text-blue-700", bgColor: "bg-blue-500" },
  "Likely D": { meaning: "Democrat is favored, but an upset is possible.", color: "text-blue-600", bgColor: "bg-blue-400" },
  "Lean D":   { meaning: "Democrat has a small advantage. Competitive race.", color: "text-blue-500", bgColor: "bg-blue-300" },
  "Toss-up":  { meaning: "Could go either way. These races decide the majority.", color: "text-amber-600", bgColor: "bg-amber-400" },
  "Lean R":   { meaning: "Republican has a small advantage. Competitive race.", color: "text-red-500", bgColor: "bg-red-300" },
  "Likely R": { meaning: "Republican is favored, but an upset is possible.", color: "text-red-600", bgColor: "bg-red-400" },
  "Safe R":   { meaning: "Republican is almost certain to win. Deep red state, strong incumbent.", color: "text-red-700", bgColor: "bg-red-500" },
};

function RatingsExplainedStep() {
  const [selected, setSelected] = useState<string>("Toss-up");
  const info = RATING_INFO[selected]!;

  return (
    <div className="space-y-5 pt-2">
      <p className="text-sm text-slate-600 leading-relaxed">
        Every Senate race gets a <strong>rating</strong> based on polling, fundraising,
        the state's political lean, and the candidates running. Tap a rating to learn more.
      </p>

      {/* Spectrum */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {RATINGS_ORDER.map((rating) => {
          const ri = RATING_INFO[rating]!;
          const isSelected = rating === selected;
          return (
            <button
              key={rating}
              onClick={() => setSelected(rating)}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border-2 ${
                isSelected
                  ? `${ri.bgColor} text-white border-transparent scale-105 shadow-md`
                  : `bg-white ${ri.color} border-slate-200 hover:border-slate-300`
              }`}
            >
              {rating}
            </button>
          );
        })}
      </div>

      {/* Selected rating detail */}
      <div className={`rounded-xl p-4 border-2 ${
        selected.includes("D") ? "border-blue-200 bg-blue-50/50" :
        selected.includes("R") ? "border-red-200 bg-red-50/50" :
        "border-amber-200 bg-amber-50/50"
      }`}>
        <h3 className={`font-bold text-lg ${info.color}`}>{selected}</h3>
        <p className="text-sm text-slate-600 mt-1">{info.meaning}</p>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
        <strong className="text-slate-700">Who sets these ratings?</strong>
        <p className="mt-1">
          Major outlets like the Cook Political Report, Sabato's Crystal Ball, and
          Inside Elections publish race ratings. They update throughout the cycle
          as new polls, fundraising data, and events shift the landscape.
        </p>
        <a href="/map" className="text-tossup font-medium mt-2 inline-block hover:underline">
          See the current ratings on the map &rarr;
        </a>
      </div>
    </div>
  );
}
