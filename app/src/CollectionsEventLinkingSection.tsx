import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarCheck,
  CalendarPlus,
  Link2,
  Pencil,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type HoldingStatus = "Needs endorsement" | "They have check" | "None";
type HoldingSubstatus = "Mailing" | "Pickup" | "Bring in" | "No response";
type EventType = "Pickup" | "Scope" | "Meeting" | "Inhome" | "Delivery";
type TaskType = "Pickup Check" | "Endorse Check" | "Sign Authorization";

type EventRef = {
  eventId: string;
  title: string;
  startISO: string;
  mode: "existing" | "new";
  eventType: EventType;
  taskType: TaskType;
  notifiedIds?: string[];
};

type Invoice = {
  id: number;
  invoiceNumber: string;
  dueDate: string;
  balance: number;
  holdingStatus: HoldingStatus;
  holdingSubstatus?: HoldingSubstatus;
  reminderDate?: string | null;
  note?: string;
  linkedEvent?: EventRef;
};

type ToastTone = "success" | "warning" | "error";
type ToastState = { tone: ToastTone; title: string; message?: string };

type ExistingEvent = {
  id: string;
  title: string;
  startISO: string;
  eventType: EventType;
};

const EVENT_TYPES: EventType[] = ["Pickup", "Scope", "Meeting", "Inhome", "Delivery"];
const TASK_TYPES: TaskType[] = ["Pickup Check", "Endorse Check", "Sign Authorization"];

const ORDER = {
  orderNumber: "1250037",
  orderName: "Cotton – Hackettstown, NJ",
  billToCompany: "National General Insurance",
  billToPerson: "Jane Doe",
  rep: "DF",
};

const INVOICES_SEED: Invoice[] = [
  {
    id: 101,
    invoiceNumber: "INV-1009",
    dueDate: "2025-10-15",
    balance: 3827.55,
    holdingStatus: "Needs endorsement",
    reminderDate: "2026-01-14",
    note: "Check received from carrier; endorsement required.",
  },
  {
    id: 102,
    invoiceNumber: "INV-1010",
    dueDate: "2025-10-31",
    balance: 1327.55,
    holdingStatus: "Needs endorsement",
    reminderDate: "2026-01-14",
  },
  {
    id: 103,
    invoiceNumber: "INV-1011",
    dueDate: "2025-11-05",
    balance: 920.0,
    holdingStatus: "They have check",
    holdingSubstatus: "Pickup",
    reminderDate: "2026-01-13",
    note: "Adjuster said check is ready for pickup at branch office.",
  },
];

const EXISTING_EVENTS: ExistingEvent[] = [
  {
    id: "EV-001",
    eventType: "Pickup",
    title: "Route planning — pick up checks (North NJ)",
    startISO: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "EV-002",
    eventType: "Meeting",
    title: "Morning admin block — endorsements / deposits",
    startISO: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "EV-003",
    eventType: "Scope",
    title: "Adjuster follow-up block",
    startISO: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
];

const COWORKERS = [
  { id: "CW-ops", name: "Ops", role: "Order Lead" },
  { id: "CW-billing", name: "Billing", role: "Billing" },
  { id: "CW-df", name: "DF", role: "Sales Rep" },
  { id: "CW-jc", name: "JC", role: "Sales Rep" },
  { id: "CW-rh", name: "RH", role: "Sales Rep" },
];

const COWORKER_BADGE_CLASS_MAP: Record<string, string> = {
  "CW-ops": "bg-violet-100 text-violet-700 border border-violet-200",
  "CW-billing": "bg-slate-100 text-slate-700 border border-slate-200",
  "CW-df": "bg-emerald-100 text-emerald-700 border border-emerald-200",
  "CW-jc": "bg-sky-100 text-sky-700 border border-sky-200",
  "CW-rh": "bg-amber-100 text-amber-700 border border-amber-200",
};

const GRID =
  "grid grid-cols-[36px_minmax(160px,1.1fr)_minmax(120px,0.9fr)_minmax(120px,0.9fr)_minmax(220px,1.4fr)_minmax(140px,1fr)_minmax(320px,2fr)] gap-x-2";

const CHECKBOX_CLS =
  "h-4 w-4 accent-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-0";

const SELECT_CLS =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-0";

const INPUT_CLS =
  "h-9 text-xs border border-slate-200 rounded-md px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-0";

const coworkerMeta = (id: string) => COWORKERS.find((c) => c.id === id);
const coworkerLabel = (id: string) => {
  const c = coworkerMeta(id);
  if (!c) return id;
  return c.role ? `${c.name} (${c.role})` : c.name;
};

const coworkerInitials = (id: string) => {
  const name = coworkerMeta(id)?.name ?? id;
  const lettersOnly = name.replace(/[^A-Za-z]/g, "");
  const src = lettersOnly || name;
  return src.slice(0, 2).toUpperCase();
};

const coworkerBadgeClasses = (id: string) => {
  const base =
    "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold";
  const color =
    COWORKER_BADGE_CLASS_MAP[id] ?? "bg-slate-100 text-slate-700 border border-slate-200";
  return `${base} ${color}`;
};

const coworkerBadgeClassesSm = (id: string) => {
  const base =
    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold";
  const color =
    COWORKER_BADGE_CLASS_MAP[id] ?? "bg-slate-100 text-slate-700 border border-slate-200";
  return `${base} ${color}`;
};

const formatCurrency = (v: number) =>
  v.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

const formatShortDate = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatShortDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const isPast = (iso: string) => new Date(iso).getTime() < Date.now();

const toISODate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const compareISODate = (a?: string | null, b?: string | null) => {
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
};

function holdingPill(s: HoldingStatus, sub?: HoldingSubstatus) {
  if (s === "None") return <span className="text-[11px] text-slate-500">—</span>;
  const base =
    "inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold";
  if (s === "Needs endorsement") {
    return (
      <span className={`${base} border-amber-200 bg-amber-50 text-amber-900`}>
        {s}
      </span>
    );
  }
  return (
    <span className={`${base} border-sky-200 bg-sky-50 text-sky-900`}>
      {sub ? `${s} · ${sub}` : s}
    </span>
  );
}

function defaultTaskTypeForInvoice(inv?: Invoice | null): TaskType {
  if (!inv) return "Pickup Check";
  if (inv.holdingStatus === "Needs endorsement") return "Endorse Check";
  if (inv.holdingStatus === "They have check") return "Pickup Check";
  return "Pickup Check";
}

function defaultEventTypeForTask(
  taskType: TaskType,
  inv?: Invoice | null
): EventType {
  if (taskType === "Pickup Check") {
    if (inv?.holdingStatus === "They have check") {
      if (inv.holdingSubstatus === "Mailing") return "Delivery";
      if (inv.holdingSubstatus === "Bring in") return "Meeting";
      if (inv.holdingSubstatus === "Pickup") return "Pickup";
      return "Meeting";
    }
    return "Pickup";
  }
  if (taskType === "Endorse Check") return "Meeting";
  return "Meeting";
}

function makeDefaultTitle(args: {
  eventType: EventType;
  taskType: TaskType;
}) {
  return `${args.eventType} — ${args.taskType} — ${ORDER.orderName} (${ORDER.orderNumber})`;
}

function toLocalDatetimeValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromLocalDatetimeValue(v: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function nextDayAt10LocalISO(dateStr?: string | null) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const base = Number.isNaN(d.getTime()) ? new Date() : d;
  const out = new Date(base);
  if (!dateStr) out.setDate(out.getDate() + 1);
  out.setHours(10, 0, 0, 0);
  return out.toISOString();
}

function applyReminderUnlessEarlier(
  existingReminder: string | null | undefined,
  candidateISO: string
) {
  const candidateDate = toISODate(candidateISO);
  if (!candidateDate) return existingReminder ?? null;
  if (!existingReminder) return candidateDate;
  const cmp = compareISODate(existingReminder, candidateDate);
  return cmp <= 0 ? existingReminder : candidateDate;
}

export default function CollectionsEventLinkingSection() {
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES_SEED);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkMode, setLinkMode] = useState<"existing" | "new">("existing");
  const [existingEventId, setExistingEventId] = useState(
    EXISTING_EVENTS[0]?.id ?? ""
  );

  const [taskType, setTaskType] = useState<TaskType>("Endorse Check");
  const [eventType, setEventType] = useState<EventType>("Meeting");

  const [newTitle, setNewTitle] = useState("");
  const [autoTitleSeed, setAutoTitleSeed] = useState("");
  const [newWhen, setNewWhen] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDetails, setNewDetails] = useState("");

  const [notifyIds, setNotifyIds] = useState<Set<string>>(() => new Set());

  const [statusOpen, setStatusOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<HoldingStatus>("Needs endorsement");
  const [nextSub, setNextSub] = useState<HoldingSubstatus>("Pickup");
  const [nextReminder, setNextReminder] = useState("");
  const [nextNote, setNextNote] = useState("");

  const notify = (next: ToastState) => {
    setToast(next);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  };

  const rows = useMemo(() => invoices, [invoices]);
  const invoicesById = useMemo(
    () => new Map(invoices.map((i) => [i.id, i] as const)),
    [invoices]
  );
  const selectedInvoiceIds = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

  const chosenExistingEvent = useMemo(
    () => EXISTING_EVENTS.find((e) => e.id === existingEventId) ?? null,
    [existingEventId]
  );

  useEffect(() => {
    if (linkMode !== "new") return;
    const nextAuto = makeDefaultTitle({ eventType, taskType });
    if (!autoTitleSeed) return;
    if (newTitle.trim() !== autoTitleSeed.trim()) return;
    if (nextAuto.trim() === autoTitleSeed.trim()) return;
    setNewTitle(nextAuto);
    setAutoTitleSeed(nextAuto);
  }, [eventType, taskType, linkMode, newTitle, autoTitleSeed]);

  const toggleAll = (checked: boolean) => {
    setSelectedIds(() => {
      const next = new Set<number>();
      if (checked) for (const r of rows) next.add(r.id);
      return next;
    });
  };

  const toggleOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const openAddToEvent = (mode: "existing" | "new" = "existing") => {
    if (selectedIds.size === 0) return;
    const first = invoicesById.get(selectedInvoiceIds[0] ?? -1);
    setLinkMode(mode);
    setExistingEventId(EXISTING_EVENTS[0]?.id ?? "");
    const reminder = first?.reminderDate ?? null;
    const t = defaultTaskTypeForInvoice(first ?? null);
    const e = defaultEventTypeForTask(t, first ?? null);
    setTaskType(t);
    setEventType(e);
    const seededTitle = makeDefaultTitle({ eventType: e, taskType: t });
    setNewTitle(seededTitle);
    setAutoTitleSeed(seededTitle);
    const whenISO = nextDayAt10LocalISO(reminder);
    setNewWhen(toLocalDatetimeValue(whenISO));
    setNewLocation("");
    setNewDetails("");
    setNotifyIds(new Set());
    setLinkOpen(true);
  };

  const applyLink = () => {
    if (selectedIds.size === 0) return;
    let event: EventRef | null = null;

    if (linkMode === "existing") {
      const chosen = EXISTING_EVENTS.find((e) => e.id === existingEventId);
      if (!chosen) return;
      event = {
        eventId: chosen.id,
        title: chosen.title,
        startISO: chosen.startISO,
        mode: "existing",
        eventType: chosen.eventType,
        taskType,
        notifiedIds: Array.from(notifyIds),
      };
    } else {
      const t = newTitle.trim();
      const whenLocal = newWhen.trim();
      if (!t || !whenLocal) return;
      const startISO = fromLocalDatetimeValue(whenLocal);
      event = {
        eventId: `NEW-${Math.random().toString(16).slice(2)}-${Date.now()}`,
        title: t,
        startISO,
        mode: "new",
        eventType,
        taskType,
        notifiedIds: Array.from(notifyIds),
      };
    }

    if (!event) return;

    const target = new Set(selectedInvoiceIds);

    setInvoices((prev) =>
      prev.map((inv) => {
        if (!target.has(inv.id)) return inv;
        const nextReminderDate = applyReminderUnlessEarlier(
          inv.reminderDate ?? null,
          event!.startISO
        );
        return { ...inv, linkedEvent: event!, reminderDate: nextReminderDate };
      })
    );

    const notifyList = Array.from(notifyIds);
    const notifyText = notifyList.length
      ? ` · notify ${notifyList.map(coworkerLabel).join(", ")}`
      : "";

    notify({
      tone: "success",
      title: "Linked to event",
      message: `${selectedInvoiceIds.length} invoice${selectedInvoiceIds.length === 1 ? "" : "s"} → ${event.title} · ${event.eventType} · ${event.taskType}${notifyText}`,
    });

    setLinkOpen(false);
    clearSelection();
  };

  const unlink = () => {
    if (selectedIds.size === 0) return;
    const target = new Set(selectedInvoiceIds);
    setInvoices((prev) =>
      prev.map((inv) =>
        target.has(inv.id) ? { ...inv, linkedEvent: undefined } : inv
      )
    );
    notify({
      tone: "warning",
      title: "Unlinked",
      message: `${selectedInvoiceIds.length} invoice${selectedInvoiceIds.length === 1 ? "" : "s"}`,
    });
    clearSelection();
  };

  const openUpdateStatus = () => {
    if (selectedIds.size === 0) return;
    const first = invoicesById.get(selectedInvoiceIds[0] ?? -1);
    const s = first?.holdingStatus ?? "Needs endorsement";
    const sub = first?.holdingSubstatus ?? "Pickup";
    setNextStatus(s);
    setNextSub(sub);
    setNextReminder(first?.reminderDate ?? "");
    setNextNote(first?.note ?? "");
    setStatusOpen(true);
  };

  const applyStatus = (andAddToEvent: boolean) => {
    if (selectedIds.size === 0) return;

    const target = new Set(selectedInvoiceIds);
    const cleanedReminder = nextReminder.trim() ? nextReminder.trim() : null;
    const cleanedNote = nextNote.trim();

    setInvoices((prev) =>
      prev.map((inv) => {
        if (!target.has(inv.id)) return inv;
        const base: Invoice = {
          ...inv,
          holdingStatus: nextStatus,
          reminderDate: cleanedReminder,
          note: cleanedNote || undefined,
        };
        if (nextStatus === "They have check")
          return { ...base, holdingSubstatus: nextSub };
        return { ...base, holdingSubstatus: undefined };
      })
    );

    notify({
      tone: "success",
      title: "Status updated",
      message: `${selectedInvoiceIds.length} invoice${selectedInvoiceIds.length === 1 ? "" : "s"} updated`,
    });

    setStatusOpen(false);

    if (andAddToEvent) {
      const first = invoicesById.get(selectedInvoiceIds[0] ?? -1);
      const phantom: Invoice | null = first
        ? {
            ...first,
            holdingStatus: nextStatus,
            holdingSubstatus:
              nextStatus === "They have check" ? nextSub : undefined,
            reminderDate: cleanedReminder,
          }
        : null;

      const t = defaultTaskTypeForInvoice(phantom);
      const e = defaultEventTypeForTask(t, phantom);

      setTaskType(t);
      setEventType(e);

      const seededTitle = makeDefaultTitle({ eventType: e, taskType: t });
      setNewTitle(seededTitle);
      setAutoTitleSeed(seededTitle);

      const whenISO = nextDayAt10LocalISO(cleanedReminder);
      setNewWhen(toLocalDatetimeValue(whenISO));

      setLinkMode("new");
      setNewLocation("");
      setNewDetails("");
      setNotifyIds(new Set());
      setLinkOpen(true);
    } else {
      clearSelection();
    }
  };

  const statusRequiresSub = nextStatus === "They have check";

  const selectedSummary = useMemo(() => {
    const first = invoicesById.get(selectedInvoiceIds[0] ?? -1);
    return {
      status: first?.holdingStatus ?? "None",
      sub: first?.holdingSubstatus,
      reminder: first?.reminderDate ?? null,
    };
  }, [invoicesById, selectedInvoiceIds]);

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="text-lg font-semibold tracking-tight">
            Event linking (single order)
          </div>
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900">{ORDER.orderName}</span>{" "}
            <span className="text-slate-500">({ORDER.orderNumber})</span>
            <span className="mx-2 text-slate-300">•</span>
            <span className="font-semibold text-slate-900">{ORDER.billToCompany}</span>
            <span className="ml-2 text-slate-600">{ORDER.billToPerson}</span>
          </div>
        </div>
        <div className="text-xs text-slate-600">
          Invoices: <span className="font-semibold text-slate-900">{rows.length}</span>
        </div>
      </header>

      <Card className="border-slate-200 bg-white">
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <div className="min-w-full">
              <div
                className={`${GRID} border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500`}
              >
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className={CHECKBOX_CLS}
                    aria-label="Select all"
                  />
                </div>
                <div>Invoice</div>
                <div className="text-center">Due</div>
                <div className="text-right">Balance</div>
                <div>Collections</div>
                <div>Reminder</div>
                <div>Event</div>
              </div>

              {rows.map((inv, idx) => {
                const isChecked = selectedIds.has(inv.id);
                const ev = inv.linkedEvent;
                const past = ev ? isPast(ev.startISO) : false;

                return (
                  <div
                    key={inv.id}
                    className={`${GRID} px-3 py-2 text-xs ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => toggleOne(inv.id, e.target.checked)}
                        className={CHECKBOX_CLS}
                        aria-label={`Select ${inv.invoiceNumber}`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-900">
                        {inv.invoiceNumber}
                      </div>
                      {inv.note ? (
                        <div className="truncate text-[11px] text-slate-500">
                          {inv.note}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">—</div>
                      )}
                    </div>

                    <div className="text-center text-[11px] text-slate-700">
                      {formatShortDate(inv.dueDate)}
                    </div>

                    <div className="text-right font-semibold tabular-nums text-slate-900">
                      {formatCurrency(inv.balance)}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        {holdingPill(inv.holdingStatus, inv.holdingSubstatus)}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-[11px] text-slate-700">
                        {formatShortDate(inv.reminderDate ?? null)}
                      </div>
                    </div>

                    <div className="min-w-0">
                      {ev ? (
                        <div
                          className={`flex min-w-0 items-start gap-2 rounded-md border px-2 py-1.5 ${
                            past
                              ? "border-amber-200 bg-amber-50"
                              : "border-sky-200 bg-sky-50"
                          }`}
                        >
                          <CalendarCheck
                            className={`mt-0.5 h-4 w-4 shrink-0 ${past ? "text-amber-700" : "text-sky-700"}`}
                          />
                          <div className="min-w-0">
                            <div className="truncate text-[11px] font-semibold text-slate-900">
                              {ev.title}
                            </div>
                            <div className="truncate text-[11px] text-slate-600">
                              {ev.eventType} · {ev.taskType}
                            </div>
                            <div
                              className={`truncate text-[11px] ${past ? "text-amber-900" : "text-slate-600"}`}
                            >
                              {formatShortDateTime(ev.startISO)}
                              {past ? " · Past" : ""}
                            </div>
                            {ev.notifiedIds?.length ? (
                              <div className="mt-0.5 truncate text-[11px] text-slate-600">
                                Notify:{" "}
                                <span className="ml-1 inline-flex flex-wrap items-center gap-1">
                                  {ev.notifiedIds.map((id) => (
                                    <span
                                      key={id}
                                      className={coworkerBadgeClassesSm(id)}
                                      title={coworkerLabel(id)}
                                    >
                                      {coworkerInitials(id)}
                                    </span>
                                  ))}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <Link2 className="h-4 w-4" />
                          Not linked
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedIds.size > 0 ? (
        <div className="fixed bottom-6 left-1/2 z-20 w-[min(980px,calc(100vw-1.5rem))] -translate-x-1/2 rounded-2xl border border-sky-800 bg-sky-900 p-2 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <div className="whitespace-nowrap pl-2 pr-1 text-xs font-semibold text-white">
              {selectedIds.size} selected
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 overflow-x-auto px-1 py-0.5">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-full px-2.5 text-xs text-sky-100 hover:bg-sky-800 hover:text-white"
                onClick={openUpdateStatus}
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Update status
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-full px-2.5 text-xs text-sky-100 hover:bg-sky-800 hover:text-white"
                onClick={() => openAddToEvent("existing")}
              >
                <CalendarPlus className="mr-2 h-3.5 w-3.5" />
                Add to event
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-full px-2.5 text-xs text-sky-100 hover:bg-sky-800 hover:text-white"
                onClick={unlink}
              >
                <Link2 className="mr-2 h-3.5 w-3.5" />
                Unlink
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0 text-sky-100 hover:bg-sky-800 hover:text-white"
                onClick={clearSelection}
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Update collections status</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5">
              <div className="space-y-4 text-xs">
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-[11px] text-slate-600">Selected</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {selectedIds.size} invoice
                    {selectedIds.size === 1 ? "" : "s"}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {ORDER.orderName}{" "}
                    <span className="font-medium">({ORDER.orderNumber})</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-600">
                    Status
                  </Label>
                  <select
                    value={nextStatus}
                    onChange={(e) =>
                      setNextStatus(e.target.value as HoldingStatus)
                    }
                    className={SELECT_CLS}
                  >
                    <option value="Needs endorsement">Needs endorsement</option>
                    <option value="They have check">They have check</option>
                    <option value="None">None</option>
                  </select>
                </div>

                {statusRequiresSub ? (
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-600">
                      Substatus
                    </Label>
                    <select
                      value={nextSub}
                      onChange={(e) =>
                        setNextSub(e.target.value as HoldingSubstatus)
                      }
                      className={SELECT_CLS}
                    >
                      <option value="Mailing">Mailing</option>
                      <option value="Pickup">Pickup</option>
                      <option value="Bring in">Bring in</option>
                      <option value="No response">No response</option>
                    </select>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-600">
                      Reminder date
                    </Label>
                    <Input
                      value={nextReminder}
                      onChange={(e) => setNextReminder(e.target.value)}
                      type="date"
                      className={INPUT_CLS}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-600">
                      Note
                    </Label>
                    <Input
                      value={nextNote}
                      onChange={(e) => setNextNote(e.target.value)}
                      className={INPUT_CLS}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStatusOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => applyStatus(false)}
              >
                Update
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-sky-700 text-white hover:bg-sky-800"
                onClick={() => applyStatus(true)}
              >
                Update + add to event
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add to event</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5">
              <div className="space-y-3 text-xs">
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-[11px] text-slate-600">Selected</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {selectedIds.size} invoice
                    {selectedIds.size === 1 ? "" : "s"}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {ORDER.orderName}{" "}
                    <span className="font-medium">({ORDER.orderNumber})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`flex-1 rounded-md border px-3 py-2 text-[11px] font-semibold transition ${
                      linkMode === "existing"
                        ? "border-sky-200 bg-sky-50 text-sky-900"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                    onClick={() => setLinkMode("existing")}
                  >
                    Link existing
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-md border px-3 py-2 text-[11px] font-semibold transition ${
                      linkMode === "new"
                        ? "border-sky-200 bg-sky-50 text-sky-900"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                    onClick={() => setLinkMode("new")}
                  >
                    Create new
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-600">
                      Task
                    </Label>
                    <select
                      value={taskType}
                      onChange={(e) =>
                        setTaskType(e.target.value as TaskType)
                      }
                      className={SELECT_CLS}
                    >
                      {TASK_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-600">
                      Event type
                    </Label>
                    {linkMode === "existing" ? (
                      <select
                        value={chosenExistingEvent?.eventType ?? EVENT_TYPES[0]}
                        disabled
                        className={SELECT_CLS}
                      >
                        {EVENT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={eventType}
                        onChange={(e) =>
                          setEventType(e.target.value as EventType)
                        }
                        className={SELECT_CLS}
                      >
                        {EVENT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {linkMode === "existing" ? (
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-600">
                      Choose event
                    </Label>
                    <select
                      value={existingEventId}
                      onChange={(e) => setExistingEventId(e.target.value)}
                      className={SELECT_CLS}
                    >
                      {EXISTING_EVENTS.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.eventType} · {ev.title}
                        </option>
                      ))}
                    </select>
                    {chosenExistingEvent ? (
                      <div className="text-[11px] text-slate-600">
                        Starts:{" "}
                        {formatShortDateTime(chosenExistingEvent.startISO)}
                      </div>
                    ) : null}
                    <div className="text-[11px] text-slate-500">
                      Reminder rule: we'll set the reminder to the event date
                      unless there's already an earlier reminder.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-600">
                        Title
                      </Label>
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className={INPUT_CLS}
                        placeholder="Event title"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-600">
                          When
                        </Label>
                        <Input
                          value={newWhen}
                          onChange={(e) => setNewWhen(e.target.value)}
                          type="datetime-local"
                          className={INPUT_CLS}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-600">
                          Location
                        </Label>
                        <Input
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          className={INPUT_CLS}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-600">
                        Details
                      </Label>
                      <Input
                        value={newDetails}
                        onChange={(e) => setNewDetails(e.target.value)}
                        className={INPUT_CLS}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Reminder rule: we'll set the reminder to the event date
                      unless there's already an earlier reminder.
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" />
                    <Label className="text-[11px] font-semibold text-slate-600">
                      Notify coworkers
                    </Label>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition ${
                        notifyIds.size === 0
                          ? "border-sky-500 bg-sky-50 text-sky-900"
                          : "border-slate-200 bg-white text-slate-700 hover:border-sky-300"
                      }`}
                      onClick={() => setNotifyIds(new Set())}
                    >
                      None
                    </button>
                    {COWORKERS.map((c) => {
                      const selected = notifyIds.has(c.id);
                      const initials = coworkerInitials(c.id);
                      const showName =
                        c.name.trim().toUpperCase() !== initials;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition ${
                            selected
                              ? "border-sky-500 bg-sky-50 text-sky-900"
                              : "border-slate-200 bg-white text-slate-700 hover:border-sky-300"
                          }`}
                          onClick={() =>
                            setNotifyIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(c.id)) next.delete(c.id);
                              else next.add(c.id);
                              return next;
                            })
                          }
                        >
                          <span
                            className={coworkerBadgeClasses(c.id)}
                            aria-hidden="true"
                          >
                            {initials}
                          </span>
                          {showName ? (
                            <span className="whitespace-nowrap text-[11px] font-semibold">
                              {c.name}
                            </span>
                          ) : null}
                          {c.role ? (
                            <span className="whitespace-nowrap text-[11px] text-slate-500">
                              · {c.role}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  {notifyIds.size > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                      <span className="font-medium">Notify:</span>
                      {Array.from(notifyIds).map((id) => (
                        <span
                          key={id}
                          className={coworkerBadgeClassesSm(id)}
                          title={coworkerLabel(id)}
                        >
                          {coworkerInitials(id)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
                  Default:{" "}
                  <span className="font-semibold text-slate-900">
                    {defaultTaskTypeForInvoice(
                      invoicesById.get(selectedInvoiceIds[0] ?? -1)
                    )}
                  </span>
                  <span className="mx-2 text-slate-300">•</span>
                  Current reminder:{" "}
                  <span className="font-semibold text-slate-900">
                    {formatShortDate(selectedSummary.reminder)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLinkOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-sky-700 text-white hover:bg-sky-800"
                onClick={applyLink}
                disabled={
                  linkMode === "existing"
                    ? !existingEventId
                    : !newTitle.trim() || !newWhen.trim()
                }
              >
                Link
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900">
                {toast.title}
              </div>
              {toast.message ? (
                <div className="mt-0.5 truncate text-[11px] text-slate-600">
                  {toast.message}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              onClick={() => setToast(null)}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
