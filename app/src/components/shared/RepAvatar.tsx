import { cn } from "../../lib/utils";
import { REPS } from "../../lib/reps";

export function RepAvatar({ repId, size = "md" }: { repId: string; size?: "sm" | "md" }) {
  const rep = REPS.find((r) => r.id === repId) ?? REPS[0];
  const s = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full text-white font-semibold shadow-sm",
        s,
        rep.colorClass
      )}
      title={rep.name}
      aria-label={rep.name}
    >
      {rep.initials}
    </div>
  );
}

// Generic user avatar used across the app for any user/person name.
// Uses initials + soft colored background, similar to rep avatars.

const USER_COLOR_CLASSES = [
  "bg-sky-100 text-sky-700 border border-sky-200",
  "bg-emerald-100 text-emerald-700 border border-emerald-200",
  "bg-amber-100 text-amber-700 border border-amber-200",
  "bg-violet-100 text-violet-700 border border-violet-200",
  "bg-rose-100 text-rose-700 border border-rose-200",
  "bg-indigo-100 text-indigo-700 border border-indigo-200",
];

function getUserColorClass(name: string) {
  if (!name) return "bg-slate-100 text-slate-700 border border-slate-200";
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0; // keep 32-bit
  }
  const idx = Math.abs(hash) % USER_COLOR_CLASSES.length;
  return USER_COLOR_CLASSES[idx];
}

function getInitials(name: string) {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function UserAvatar({
  name,
  size = "sm",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const s = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  const colorClass = getUserColorClass(name);
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold shadow-sm",
        s,
        colorClass
      )}
      title={name}
      aria-label={name}
    >
      {initials}
    </div>
  );
}

