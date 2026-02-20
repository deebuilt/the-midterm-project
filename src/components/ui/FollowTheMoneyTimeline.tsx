import { useState } from "react";

export interface TimelineEvent {
  step: number;
  date: string;
  title: string;
  thread: "doge" | "crypto" | "peace";
  detail: string;
  sourceUrl?: string;
  sourceLabel?: string;
}

interface Props {
  events: TimelineEvent[];
}

const threadMeta = {
  doge: { label: "DOGE", bg: "bg-navy", bgLight: "bg-navy/10", border: "border-navy/30", text: "text-navy", pill: "bg-navy/15 text-navy" },
  crypto: { label: "Crypto", bg: "bg-tossup", bgLight: "bg-tossup/10", border: "border-tossup/30", text: "text-tossup", pill: "bg-tossup/15 text-tossup" },
  peace: { label: "Board of Peace", bg: "bg-ind", bgLight: "bg-ind/10", border: "border-ind/30", text: "text-ind", pill: "bg-ind/15 text-ind" },
};

export default function FollowTheMoneyTimeline({ events }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [activeThreads, setActiveThreads] = useState<Set<string>>(new Set(["doge", "crypto", "peace"]));

  const toggle = (step: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(step)) next.delete(step);
      else next.add(step);
      return next;
    });
  };

  const toggleThread = (thread: string) => {
    setActiveThreads((prev) => {
      const next = new Set(prev);
      if (next.has(thread)) {
        if (next.size > 1) next.delete(thread);
      } else {
        next.add(thread);
      }
      return next;
    });
  };

  const expandAll = () => {
    const visible = events.filter((e) => activeThreads.has(e.thread));
    setExpanded(new Set(visible.map((e) => e.step)));
  };

  const collapseAll = () => setExpanded(new Set());

  const allExpanded = events
    .filter((e) => activeThreads.has(e.thread))
    .every((e) => expanded.has(e.step));

  const visibleEvents = events.filter((e) => activeThreads.has(e.thread));

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex flex-wrap gap-2">
          {(["doge", "crypto", "peace"] as const).map((t) => {
            const meta = threadMeta[t];
            const active = activeThreads.has(t);
            return (
              <button
                key={t}
                onClick={() => toggleThread(t)}
                aria-pressed={active}
                className={`text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all ${
                  active
                    ? `${meta.pill} ${meta.border}`
                    : "bg-slate-100 text-slate-400 border-slate-200"
                }`}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={allExpanded ? collapseAll : expandAll}
          className="text-xs text-dem hover:underline font-medium"
        >
          {allExpanded ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-200 md:left-[99px]" />

        <div className="space-y-0">
          {visibleEvents.map((event, i) => {
            const meta = threadMeta[event.thread];
            const isOpen = expanded.has(event.step);
            const isLast = i === visibleEvents.length - 1;

            return (
              <div key={event.step} className={`relative ${isLast ? "" : "pb-6"}`}>
                <div className="flex items-start gap-4 md:gap-6">
                  {/* Date — hidden on mobile, shown left on desktop */}
                  <div className="hidden md:block w-[80px] shrink-0 text-right pt-0.5">
                    <span className="text-xs text-slate-400 font-medium">{event.date}</span>
                  </div>

                  {/* Dot */}
                  <div className={`relative z-10 w-[10px] h-[10px] rounded-full ${meta.bg} mt-1.5 shrink-0 ring-4 ring-white`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Date — shown on mobile only */}
                    <span className="block md:hidden text-xs text-slate-400 font-medium mb-1">{event.date}</span>

                    <button
                      onClick={() => toggle(event.step)}
                      aria-expanded={isOpen}
                      className="w-full text-left flex items-start gap-2 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.pill}`}>
                            {meta.label}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-navy group-hover:text-dem transition-colors leading-snug">
                          {event.title}
                        </h3>
                      </div>
                      <svg
                        className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Expandable detail */}
                    <div
                      className={`grid transition-all duration-200 ease-in-out ${
                        isOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="text-sm text-slate-600 leading-relaxed">{event.detail}</p>
                        {event.sourceUrl && (
                          <a
                            href={event.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-xs text-dem hover:underline mt-2 font-medium"
                          >
                            {event.sourceLabel || "Source"} &rarr;
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
