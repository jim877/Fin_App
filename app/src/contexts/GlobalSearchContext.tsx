import * as React from "react";

type GlobalSearchState = {
  query: string;
  setQuery: (value: string) => void;
};

const GlobalSearchContext = React.createContext<GlobalSearchState | null>(null);

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = React.useState("");
  const value = React.useMemo(() => ({ query, setQuery }), [query]);
  return (
    <GlobalSearchContext.Provider value={value}>
      {children}
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearch(): GlobalSearchState {
  const ctx = React.useContext(GlobalSearchContext);
  if (!ctx) {
    return {
      query: "",
      setQuery: () => {},
    };
  }
  return ctx;
}
