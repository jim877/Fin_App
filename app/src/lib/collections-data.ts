/**
 * Shared data for Collections: orders (with optional drawer fields), invoices, activity, docs.
 */

export type Order = {
  id: number;
  orderNumber: string;
  orderName: string;
  billTo: string;
  billToCompany: string;
  rep: string;
  nextFollowUpDate?: string | null;
  claimNumber?: string;
  policyNumber?: string;
  serviceAddress?: string;
  billToEmail?: string;
  billToPhone?: string;
  lossDate?: string;
};

export type InvoiceStatus = "Unpaid" | "Partial" | "Disputed" | "Paid";
export type InvoiceType = "Storage" | "Supplemental" | "Contents" | "Mitigation" | "Other";

export type EventType = "Pickup" | "Scope" | "Meeting" | "Inhome" | "Delivery";
export type TaskType = "Pickup Check" | "Endorse Check" | "Sign Authorization";

export type EventRef = {
  eventId: string;
  title: string;
  startISO: string;
  mode: "existing" | "new";
  eventType: EventType;
  taskType: TaskType;
  notifiedIds?: string[];
};

export type ExistingEvent = {
  id: string;
  title: string;
  startISO: string;
  eventType: EventType;
};

export type Invoice = {
  id: number;
  orderId: number;
  invoiceNumber: string;
  type: InvoiceType;
  billedDate: string;
  dueDate: string;
  amount: number;
  balance: number;
  status: InvoiceStatus;
  lastNote?: string;
  reminderDate?: string | null;
  linkedEvent?: EventRef;
  holdingStatus?: string;
  holdingSubstatus?: string;
};

export type ActivityType = "Email" | "Call" | "Text" | "Portal" | "Doc" | "Note";

export type Activity = {
  id: number;
  orderId: number;
  type: ActivityType;
  at: string;
  by: string;
  detail: string;
};

export type DocItem = {
  id: number;
  orderId: number;
  name: string;
  status: "Missing" | "Received";
};

export const COLLECTION_ORDERS: Order[] = [
  {
    id: 1,
    orderNumber: "1250037",
    orderName: "Cotton – Hackettstown, NJ",
    billTo: "Jane Doe",
    billToCompany: "National General Insurance",
    rep: "DF",
    nextFollowUpDate: "2025-11-25",
    claimNumber: "NG-22194-AX",
    policyNumber: "POL-88321",
    serviceAddress: "44 Maple Ave, Hackettstown, NJ",
    billToEmail: "jane.doe@nationalgeneral.example",
    billToPhone: "(555) 212-9090",
    lossDate: "2025-07-18",
  },
  {
    id: 2,
    orderNumber: "1250679",
    orderName: "Winterroth – Yonkers, NY",
    billTo: "Morgan Reed",
    billToCompany: "Travelers",
    rep: "JC",
    nextFollowUpDate: "2025-11-23",
    claimNumber: "TRV-78101",
    policyNumber: "POL-10419",
    serviceAddress: "12 Ash St, Yonkers, NY",
    billToEmail: "m.smith@travelers.example",
    billToPhone: "(555) 410-2201",
    lossDate: "2025-08-03",
  },
  {
    id: 3,
    orderNumber: "1250220",
    orderName: "Parry – New York, NY",
    billTo: "Alex Kim",
    billToCompany: "Allstate",
    rep: "JC",
    nextFollowUpDate: "2025-12-01",
    claimNumber: "ALL-55019",
    policyNumber: "POL-99201",
    serviceAddress: "8 W 23rd St, New York, NY",
    billToEmail: "alicia.chen@allstate.example",
    billToPhone: "(555) 301-9922",
    lossDate: "2025-09-02",
  },
  {
    id: 4,
    orderNumber: "1240703",
    orderName: "Lee – Somerset, NJ",
    billTo: "Taylor Nguyen",
    billToCompany: "Safeco",
    rep: "RH",
    nextFollowUpDate: null,
    claimNumber: "SF-44001",
    policyNumber: "POL-55102",
    lossDate: "2025-08-15",
  },
  {
    id: 5,
    orderNumber: "1250818",
    orderName: "Schor – Chalfont, PA",
    billTo: "Chris Patel",
    billToCompany: "USAA",
    rep: "RH",
    nextFollowUpDate: "2025-11-26",
    claimNumber: "US-120045",
    policyNumber: "POL-88192",
    serviceAddress: "100 Main St, Chalfont, PA",
    billToEmail: "chris.patel@usaa.example",
    billToPhone: "(555) 555-0123",
    lossDate: "2025-09-30",
  },
];

export type HoldingStage =
  | "They have check"
  | "Needs endorsement"
  | "Pending deposit";

export const COLLECTION_INVOICES: Invoice[] = [
  { id: 101, orderId: 1, invoiceNumber: "INV-1001", type: "Storage", billedDate: "2025-09-15", dueDate: "2025-10-15", amount: 3200, balance: 1200, status: "Unpaid", lastNote: "Adjuster requested updated statement; sent on 11/16.", holdingStatus: "They have check" },
  { id: 102, orderId: 1, invoiceNumber: "INV-1010", type: "Supplemental", billedDate: "2025-10-01", dueDate: "2025-10-31", amount: 2500, balance: 3827.55, status: "Partial", lastNote: "Partial payment received; remaining balance expected with next check.", holdingStatus: "Needs endorsement" },
  { id: 201, orderId: 2, invoiceNumber: "INV-1100", type: "Supplemental", billedDate: "2025-09-10", dueDate: "2025-10-10", amount: 20000, balance: 15000, status: "Unpaid", lastNote: "Insured confirmed payment once supplemental is processed.", holdingStatus: "They have check" },
  { id: 301, orderId: 3, invoiceNumber: "INV-1200", type: "Contents", billedDate: "2025-10-15", dueDate: "2025-11-14", amount: 7549.97, balance: 7549.97, status: "Unpaid", lastNote: "Initial bill submitted; awaiting portal confirmation.", holdingStatus: "Pending deposit" },
  { id: 401, orderId: 5, invoiceNumber: "INV-1300", type: "Storage", billedDate: "2025-09-05", dueDate: "2025-10-05", amount: 574.4, balance: 574.4, status: "Unpaid", lastNote: "Left voicemail with policyholder regarding outstanding balance.", holdingStatus: "Pending deposit" },
  { id: 402, orderId: 5, invoiceNumber: "INV-1301", type: "Storage", billedDate: "2025-10-02", dueDate: "2025-11-01", amount: 220, balance: 0, status: "Paid", lastNote: "Paid in full." },
];

export const COLLECTION_ACTIVITY: Activity[] = [
  { id: 1, orderId: 1, type: "Email", at: "2026-01-10T14:05:00Z", by: "DF", detail: "Emailed statement + supporting docs (COS, photos)." },
  { id: 2, orderId: 1, type: "Portal", at: "2026-01-08T16:42:00Z", by: "DF", detail: "Uploaded supplemental invoice to carrier portal." },
  { id: 3, orderId: 2, type: "Call", at: "2026-01-07T14:55:00Z", by: "JC", detail: "Spoke w/ adjuster; dispute review ETA 7–10 days." },
  { id: 4, orderId: 3, type: "Text", at: "2026-01-05T19:05:00Z", by: "JC", detail: "Customer confirmed check will be brought in this week." },
  { id: 5, orderId: 5, type: "Call", at: "2026-01-06T18:15:00Z", by: "RH", detail: "Left voicemail re: outstanding balance." },
];

export const COLLECTION_DOCS: DocItem[] = [
  { id: 1, orderId: 1, name: "Certificate of Satisfaction (COS)", status: "Received" },
  { id: 2, orderId: 1, name: "Itemized invoice + statement", status: "Received" },
  { id: 3, orderId: 2, name: "Storage logs", status: "Received" },
  { id: 4, orderId: 3, name: "Invoice + photos", status: "Missing" },
  { id: 5, orderId: 5, name: "Invoice + statement", status: "Received" },
];

export const EVENT_TYPES: EventType[] = ["Pickup", "Scope", "Meeting", "Inhome", "Delivery"];
export const TASK_TYPES: TaskType[] = ["Pickup Check", "Endorse Check", "Sign Authorization"];

export const EXISTING_EVENTS: ExistingEvent[] = [
  { id: "EV-001", eventType: "Pickup", title: "Route planning — pick up checks (North NJ)", startISO: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString() },
  { id: "EV-002", eventType: "Meeting", title: "Morning admin block — endorsements / deposits", startISO: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString() },
  { id: "EV-003", eventType: "Scope", title: "Adjuster follow-up block", startISO: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString() },
];

export const COWORKERS = [
  { id: "CW-ops", name: "Ops", role: "Order Lead" },
  { id: "CW-billing", name: "Billing", role: "Billing" },
  { id: "CW-df", name: "DF", role: "Sales Rep" },
  { id: "CW-jc", name: "JC", role: "Sales Rep" },
  { id: "CW-rh", name: "RH", role: "Sales Rep" },
];

// Event linking helpers (invoice shape: optional holdingStatus, holdingSubstatus, reminderDate)
export function defaultTaskTypeForInvoice(inv?: { holdingStatus?: string } | null): TaskType {
  if (!inv?.holdingStatus || inv.holdingStatus === "None") return "Pickup Check";
  if (String(inv.holdingStatus).toLowerCase().includes("endorsement")) return "Endorse Check";
  return "Pickup Check";
}

export function defaultEventTypeForTask(taskType: TaskType, inv?: { holdingStatus?: string; holdingSubstatus?: string } | null): EventType {
  if (taskType === "Pickup Check" && inv?.holdingStatus?.includes("has check")) {
    const sub = (inv.holdingSubstatus ?? "").toLowerCase();
    if (sub === "mailing") return "Delivery";
    if (sub === "bring in") return "Meeting";
    if (sub === "pickup") return "Pickup";
    return "Meeting";
  }
  if (taskType === "Endorse Check") return "Meeting";
  return "Pickup";
}

export function makeDefaultTitle(args: { eventType: EventType; taskType: TaskType; orderName: string; orderNumber: string }) {
  return `${args.eventType} — ${args.taskType} — ${args.orderName} (${args.orderNumber})`;
}

export function formatShortDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function toISODate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function compareISODate(a?: string | null, b?: string | null): number {
  const da = a ? new Date(a) : null;
  const db = b ? new Date(b) : null;
  if (!da || Number.isNaN(da.getTime())) return -1;
  if (!db || Number.isNaN(db.getTime())) return 1;
  const aMid = new Date(da);
  const bMid = new Date(db);
  aMid.setHours(0, 0, 0, 0);
  bMid.setHours(0, 0, 0, 0);
  if (aMid.getTime() === bMid.getTime()) return 0;
  return aMid.getTime() < bMid.getTime() ? -1 : 1;
}

export function applyReminderUnlessEarlier(existingReminder: string | null | undefined, candidateISO: string): string | null {
  const candidateDate = toISODate(candidateISO);
  if (!candidateDate) return existingReminder ?? null;
  if (!existingReminder) return candidateDate;
  const cmp = compareISODate(existingReminder, candidateDate);
  return cmp <= 0 ? existingReminder : candidateDate;
}

export function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalDatetimeValue(v: string): string {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

export function nextDayAt10LocalISO(dateStr?: string | null): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const base = Number.isNaN(d.getTime()) ? new Date() : d;
  const out = new Date(base);
  if (!dateStr) out.setDate(out.getDate() + 1);
  out.setHours(10, 0, 0, 0);
  return out.toISOString();
}

export function coworkerLabel(id: string): string {
  const c = COWORKERS.find((x) => x.id === id);
  if (!c) return id;
  return c.role ? `${c.name} (${c.role})` : c.name;
}

export function coworkerInitials(id: string): string {
  const name = COWORKERS.find((x) => x.id === id)?.name ?? id;
  const lettersOnly = name.replace(/[^A-Za-z]/g, "");
  return (lettersOnly || name).slice(0, 2).toUpperCase();
}

const COWORKER_BADGE_MAP: Record<string, string> = {
  "CW-ops": "bg-violet-100 text-violet-700 border border-violet-200",
  "CW-billing": "bg-slate-100 text-slate-700 border border-slate-200",
  "CW-df": "bg-emerald-100 text-emerald-700 border border-emerald-200",
  "CW-jc": "bg-sky-100 text-sky-700 border border-sky-200",
  "CW-rh": "bg-amber-100 text-amber-700 border border-amber-200",
};

export function coworkerBadgeClasses(id: string): string {
  const base = "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold";
  const color = COWORKER_BADGE_MAP[id] ?? "bg-slate-100 text-slate-700 border border-slate-200";
  return `${base} ${color}`;
}

export function coworkerBadgeClassesSm(id: string): string {
  const base = "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold";
  const color = COWORKER_BADGE_MAP[id] ?? "bg-slate-100 text-slate-700 border border-slate-200";
  return `${base} ${color}`;
}
