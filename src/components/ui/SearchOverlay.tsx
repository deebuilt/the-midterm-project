import { useState, useEffect, useRef, useMemo } from "react";
import { searchIndex, type SearchEntry } from "../../data/searchIndex";
import { glossary } from "../../data/glossary";

const categoryLabels: Record<SearchEntry["category"], string> = {
  guide: "Guide",
  glossary: "Glossary",
  tool: "Tool",
  page: "Page",
};

const categoryColors: Record<SearchEntry["category"], string> = {
  guide: "bg-blue-100 text-blue-700",
  glossary: "bg-purple-100 text-purple-700",
  tool: "bg-green-100 text-green-700",
  page: "bg-slate-100 text-slate-600",
};

type Result = SearchEntry;

export default function SearchOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build full index including glossary terms
  const fullIndex = useMemo<Result[]>(() => {
    const glossaryEntries: Result[] = glossary.map((g) => ({
      title: g.term,
      description: g.short,
      href: `/glossary#${g.slug}`,
      category: "glossary" as const,
    }));
    return [...searchIndex, ...glossaryEntries];
  }, []);

  // Filter results
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return fullIndex
      .filter(
        (entry) =>
          entry.title.toLowerCase().includes(q) ||
          entry.description.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [query, fullIndex]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Keyboard shortcut to open (Ctrl+K or Cmd+K)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Listen for custom event from header button
  useEffect(() => {
    function onOpen() {
      setIsOpen(true);
    }
    window.addEventListener("open-search", onOpen);
    return () => window.removeEventListener("open-search", onOpen);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      window.location.href = results[selectedIndex].href;
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center border-b border-slate-200 px-4">
          <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search guides, glossary, tools..."
            className="flex-1 px-3 py-4 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
          />
          <kbd className="hidden sm:inline-block text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {query.trim() && (
          <div className="max-h-[50vh] overflow-y-auto">
            {results.length > 0 ? (
              <ul className="py-2">
                {results.map((result, i) => (
                  <li key={result.href}>
                    <a
                      href={result.href}
                      className={`block px-4 py-3 transition-colors ${
                        i === selectedIndex
                          ? "bg-slate-50"
                          : "hover:bg-slate-50"
                      }`}
                      onMouseEnter={() => setSelectedIndex(i)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-800">
                          {result.title}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            categoryColors[result.category]
                          }`}
                        >
                          {categoryLabels[result.category]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {result.description}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                No results for "{query}"
              </div>
            )}
          </div>
        )}

        {/* Empty state hint */}
        {!query.trim() && (
          <div className="px-4 py-6 text-center text-sm text-slate-400">
            Type to search across guides, glossary terms, and tools
          </div>
        )}
      </div>
    </div>
  );
}
