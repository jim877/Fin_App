import * as React from "react";
import { Search } from "lucide-react";
import { useGlobalSearch } from "@/contexts/GlobalSearchContext";

const PILL_COLLAPSED_W = "w-9";
const PILL_EXPANDED_W = "w-64";

export function HeaderSearchPill() {
  const { query, setQuery } = useGlobalSearch();
  const [expanded, setExpanded] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded]);

  return (
    <div
      className={`flex items-center overflow-hidden rounded-full border border-slate-200 bg-sky-500/10 transition-[width] duration-200 ${expanded || query ? PILL_EXPANDED_W : PILL_COLLAPSED_W}`}
    >
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-600 hover:bg-sky-500/20 hover:text-sky-800"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>
      {expanded || query ? (
        <>
          <input
            ref={inputRef}
            type="search"
            placeholder="Search this page…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => {
              if (!query) setExpanded(false);
            }}
            className="h-8 min-w-0 flex-1 bg-transparent px-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="shrink-0 px-2 py-1 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              ×
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
