import * as React from "react";

export type UserEntry = { id: string; name: string };

export const APP_USERS: UserEntry[] = [
  { id: "jim", name: "Jim Fen" },
  { id: "jc", name: "Jordan Carter" },
  { id: "df", name: "Dina Flores" },
  { id: "rh", name: "Riley Hart" },
  { id: "ma", name: "MA" },
];

type CurrentUserState = {
  currentUser: UserEntry;
  setCurrentUser: (id: string, name: string) => void;
};

const defaultUser = APP_USERS[0]!;

const CurrentUserContext = React.createContext<CurrentUserState | null>(null);

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setState] = React.useState<UserEntry>(() => defaultUser);
  const setCurrentUser = React.useCallback((id: string, name: string) => {
    setState({ id, name });
  }, []);
  const value = React.useMemo(
    () => ({ currentUser, setCurrentUser }),
    [currentUser, setCurrentUser]
  );
  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = React.useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within CurrentUserProvider");
  return ctx;
}

export function useCurrentUserOptional() {
  return React.useContext(CurrentUserContext);
}
