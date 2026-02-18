export type Rep = {
  id: string;
  name: string;
  initials: string;
  colorClass: string; // tailwind bg-* class
};

export const REPS: Rep[] = [
  { id: "r1", name: "Ava Kim", initials: "AK", colorClass: "bg-rose-500" },
  { id: "r2", name: "Noah Patel", initials: "NP", colorClass: "bg-sky-500" },
  { id: "r3", name: "Mia Rivera", initials: "MR", colorClass: "bg-emerald-500" },
  { id: "r4", name: "Leo Chen", initials: "LC", colorClass: "bg-violet-500" },
];
