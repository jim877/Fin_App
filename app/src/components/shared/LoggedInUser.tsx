import { User } from "lucide-react";
import { useCurrentUserOptional } from "@/contexts/CurrentUserContext";

function initials(name: string) {
  const s = (name || "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

/**
 * Compact logged-in user chip for page headers. Renders nothing if CurrentUser context is not available.
 */
export function LoggedInUser() {
  const currentUser = useCurrentUserOptional();
  if (!currentUser) return null;
  const { name } = currentUser.currentUser;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-sky-500/10 px-2.5 py-1.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-700 text-xs font-semibold text-white">
        {initials(name)}
      </div>
      <span className="text-xs font-semibold text-slate-800">{name}</span>
      <User className="h-3.5 w-3.5 text-slate-400" aria-hidden />
    </div>
  );
}
