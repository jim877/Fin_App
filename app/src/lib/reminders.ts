/** Shared reminder (follow-up) type and constants for dashboard + header. */

export type Reminder = {
  id: string;
  section: string;
  title: string;
  detail: string;
  createdAt: string;
  assignedTo: string;
  done: boolean;
  dueDate?: string;
  dueTime?: string;
};

export const REMINDER_SECTIONS = [
  { id: "billingPrep", label: "Invoice Prep" },
  { id: "billing", label: "Billing" },
  { id: "review", label: "Review" },
  { id: "storage", label: "Storage" },
  { id: "collections", label: "Collections" },
  { id: "payables", label: "Payables" },
];

export const REMINDER_USERS = [
  { id: "jim", name: "Jim", dot: "bg-slate-700" },
  { id: "jc", name: "JC", dot: "bg-indigo-600" },
  { id: "df", name: "DF", dot: "bg-emerald-600" },
  { id: "rh", name: "RH", dot: "bg-orange-500" },
  { id: "ma", name: "MA", dot: "bg-slate-500" },
];

export const INITIAL_REMINDERS: Reminder[] = [
  {
    id: "fu-1",
    section: "billingPrep",
    title: "Prep invoice • Winterroth-YonkersNY",
    detail: "Verify docs + scope",
    createdAt: "2025-11-10",
    assignedTo: "jc",
    done: false,
  },
  {
    id: "fu-2",
    section: "billing",
    title: "Send invoice • Russenbeger-CliffsideParkNJ",
    detail: "Confirm payer + send",
    createdAt: "2025-11-13",
    assignedTo: "df",
    done: false,
  },
  {
    id: "fu-3",
    section: "collections",
    title: "Collections reminder • Parry-NewYorkNY",
    detail: "Check payment status",
    createdAt: "2025-11-14",
    assignedTo: "jc",
    done: false,
  },
  {
    id: "fu-4",
    section: "review",
    title: "Review write-off • Filenbaum-NewYorkNY",
    detail: "Confirm reason + notes",
    createdAt: "2025-11-14",
    assignedTo: "jc",
    done: false,
  },
  {
    id: "fu-5",
    section: "storage",
    title: "Storage reminder",
    detail: "Confirm pickup / move schedule",
    createdAt: "2025-11-14",
    assignedTo: "rh",
    done: false,
  },
  {
    id: "fu-6",
    section: "payables",
    title: "Approve vendor payment",
    detail: "Vendor invoice waiting approval",
    createdAt: "2025-11-14",
    assignedTo: "jim",
    done: false,
  },
];

export function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function reminderUid(prefix = "fu"): string {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}
