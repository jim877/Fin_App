import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  FileText,
  Link2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  SlidersHorizontal,
  Tag,
  X,
  Zap,
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
import {
  COLLECTION_INVOICES,
  COLLECTION_ORDERS,
  COWORKERS,
  EVENT_TYPES,
  EXISTING_EVENTS,
  TASK_TYPES,
  applyReminderUnlessEarlier,
  coworkerBadgeClasses,
  coworkerBadgeClassesSm,
  coworkerInitials,
  coworkerLabel,
  defaultEventTypeForTask,
  defaultTaskTypeForInvoice,
  formatShortDateTime,
  fromLocalDatetimeValue,
  makeDefaultTitle,
  nextDayAt10LocalISO,
  toLocalDatetimeValue,
  type Order,
  type Invoice,
  type InvoiceStatus,
  type EventRef,
  type EventType,
  type TaskType,
  type HoldingStage,
} from "@/lib/collections-data";
import { useGlobalSearch } from "@/contexts/GlobalSearchContext";
import { Users } from "lucide-react";

const ORDERS = COLLECTION_ORDERS;
const SELECT_CLS = "h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-200";
const INPUT_CLS = "h-9 text-xs rounded-md border border-slate-200 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200";

const REP_COLOR_CLASS_MAP: Record<string, string> = {
  JC: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
  DF: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  RH: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  MA: "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
};

function repBadgeClasses(rep: string) {
  const base = "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold";
  const color = REP_COLOR_CLASS_MAP[rep] ?? "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  return `${base} ${color}`;
}

function formatCurrency(v: number) {
  return v.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysSince(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(dateStr);
  if (Number.isNaN(start.getTime())) return 0;
  start.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

function agingMeta(days: number) {
  let color = "bg-slate-400";
  if (days >= 90) color = "bg-red-500";
  else if (days >= 30) color = "bg-orange-400";
  const label = days <= 0 ? "Current" : days === 1 ? "1 day" : `${days} days`;
  return { color, label };
}

type OrderSortKey = "openBalance" | "invoiceCount" | "orderName" | "billTo" | "followUp" | "rep" | "status";
type InvoiceSortKey = "dueDate" | "billedDate" | "invoiceNumber" | "amount" | "balance" | "status";

function safeTime(s: string) {
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function safeTimeOrNull(s?: string | null) {
  if (!s) return null;
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? null : t;
}

type CollectionsLedgerSectionProps = {
  onOrderNameClick?: (order: Order) => void;
};

export type StageFilterValue = "All" | HoldingStage | "Deposited";

export default function CollectionsLedgerSection({ onOrderNameClick }: CollectionsLedgerSectionProps) {
  const { query: q } = useGlobalSearch();
  const [invoices, setInvoices] = useState<Invoice[]>(COLLECTION_INVOICES);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [collapsedByOrder, setCollapsedByOrder] = useState<Record<number, boolean>>({});
  const [stageFilter, setStageFilter] = useState<StageFilterValue>("All");
  const [repFilter, setRepFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "All">("All");
  const [orderSortKey, setOrderSortKey] = useState<OrderSortKey>("openBalance");
  const [orderSortDir, setOrderSortDir] = useState<"asc" | "desc">("desc");
  const [invoiceSortKey, setInvoiceSortKey] = useState<InvoiceSortKey>("dueDate");
  const [invoiceSortDir, setInvoiceSortDir] = useState<"asc" | "desc">("asc");
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(() => new Set());
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<number>>(() => new Set());
  const [focusedOrderId, setFocusedOrderId] = useState<number | null>(null);

  const [statusOpen, setStatusOpen] = useState(false);
  const [holdingStatus, setHoldingStatus] = useState<string>("None");
  const [holdingSubstatus, setHoldingSubstatus] = useState<string>("Mailing");
  const [statusReminder, setStatusReminder] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [statusAutoFU, setStatusAutoFU] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkMode, setLinkMode] = useState<"existing" | "new">("existing");
  const [existingEventId, setExistingEventId] = useState(EXISTING_EVENTS[0]?.id ?? "");
  const [linkTaskType, setLinkTaskType] = useState<TaskType>("Pickup Check");
  const [linkEventType, setLinkEventType] = useState<EventType>("Pickup");
  const [newTitle, setNewTitle] = useState("");
  const [autoTitleSeed, setAutoTitleSeed] = useState("");
  const [newWhen, setNewWhen] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [notifyIds, setNotifyIds] = useState<Set<string>>(() => new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeMode, setDisputeMode] = useState<"open" | "resolve">("open");
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditMode, setAuditMode] = useState<"update" | "resolve">("update");
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markPaidReason, setMarkPaidReason] = useState("");
  const [toast, setToast] = useState<{ title: string; message?: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (title: string, message?: string) => {
    setToast({ title, message });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

  const openStatusDialog = () => {
    if (anySelection) {
      setStatusReminder("");
      setStatusNote("");
      setStatusOpen(true);
    }
  };

  const applyStatus = (andAddToEvent: boolean) => {
    const n = selectedRowIds.size > 0 ? selectedRowIds.size : selectedInvoiceIds.size;
    notify("Status updated", `${n} item${n === 1 ? "" : "s"} updated`);
    setStatusOpen(false);
    if (andAddToEvent) {
      openLinkDialog("new");
    } else {
      clearSelection();
    }
  };

  const invoicesById = useMemo(() => new Map(invoices.map((i) => [i.id, i])), [invoices]);

  const orderById = useMemo(() => {
    return ORDERS.reduce<Record<number, Order>>((acc, o) => {
      acc[o.id] = o;
      return acc;
    }, {});
  }, []);

  const openInvoices = useMemo(() => {
    let list: Invoice[];
    if (stageFilter === "Deposited") {
      list = invoices.filter((inv) => inv.status === "Paid" || inv.balance === 0);
    } else {
      list = invoices.filter((inv) => inv.balance > 0 && inv.status !== "Paid");
      if (stageFilter !== "All") {
        list = list.filter((inv) => (inv.holdingStatus ?? "") === stageFilter);
      }
    }
    if (repFilter !== "All") {
      list = list.filter((inv) => orderById[inv.orderId]?.rep === repFilter);
    }
    if (statusFilter !== "All") {
      list = list.filter((inv) => inv.status === statusFilter);
    }
    return list;
  }, [invoices, stageFilter, repFilter, statusFilter, orderById]);

  const linkTargetIds = useMemo(() => {
    if (selectedInvoiceIds.size > 0) return Array.from(selectedInvoiceIds);
    const orderIds = new Set(selectedRowIds);
    return openInvoices.filter((inv) => orderIds.has(inv.orderId)).map((inv) => inv.id);
  }, [selectedInvoiceIds, selectedRowIds, openInvoices]);

  const firstLinkInvoice = linkTargetIds.length > 0 ? invoicesById.get(linkTargetIds[0]) : null;
  const firstLinkOrder = firstLinkInvoice ? orderById[firstLinkInvoice.orderId] : null;

  const openLinkDialog = (mode: "existing" | "new" = "existing") => {
    if (linkTargetIds.length === 0) return;
    setLinkMode(mode);
    setExistingEventId(EXISTING_EVENTS[0]?.id ?? "");
    const inv = firstLinkInvoice;
    const order = firstLinkOrder;
    const phantom = inv
      ? { ...inv, ...(holdingStatus !== "None" && { holdingStatus, holdingSubstatus }) }
      : (holdingStatus !== "None" ? { holdingStatus, holdingSubstatus } : null);
    const t = defaultTaskTypeForInvoice(phantom ?? undefined);
    const e = defaultEventTypeForTask(t, phantom ?? undefined);
    setLinkTaskType(t);
    setLinkEventType(e);
    const orderName = order?.orderName ?? "Order";
    const orderNumber = order?.orderNumber ?? "";
    const seededTitle = makeDefaultTitle({ eventType: e, taskType: t, orderName, orderNumber });
    setNewTitle(seededTitle);
    setAutoTitleSeed(seededTitle);
    const whenISO = nextDayAt10LocalISO(inv?.reminderDate ?? (statusReminder || null));
    setNewWhen(toLocalDatetimeValue(whenISO));
    setNewLocation("");
    setNewDetails("");
    setNotifyIds(new Set());
    setLinkOpen(true);
  };

  const applyLink = () => {
    if (linkTargetIds.length === 0) return;
    let event: EventRef | null = null;
    const chosenExisting = EXISTING_EVENTS.find((e) => e.id === existingEventId);
    if (linkMode === "existing" && chosenExisting) {
      event = {
        eventId: chosenExisting.id,
        title: chosenExisting.title,
        startISO: chosenExisting.startISO,
        mode: "existing",
        eventType: chosenExisting.eventType,
        taskType: linkTaskType,
        notifiedIds: Array.from(notifyIds),
      };
    } else if (linkMode === "new" && newTitle.trim() && newWhen.trim()) {
      event = {
        eventId: `NEW-${Math.random().toString(16).slice(2)}-${Date.now()}`,
        title: newTitle.trim(),
        startISO: fromLocalDatetimeValue(newWhen.trim()),
        mode: "new",
        eventType: linkEventType,
        taskType: linkTaskType,
        notifiedIds: Array.from(notifyIds),
      };
    }
    if (!event) return;
    const target = new Set(linkTargetIds);
    setInvoices((prev) =>
      prev.map((inv) => {
        if (!target.has(inv.id)) return inv;
        const nextReminder = applyReminderUnlessEarlier(inv.reminderDate ?? null, event!.startISO);
        return { ...inv, linkedEvent: event!, reminderDate: nextReminder };
      })
    );
    const notifyList = Array.from(notifyIds).map(coworkerLabel);
    notify("Linked to event", `${linkTargetIds.length} invoice(s) → ${event.title} · ${event.eventType} · ${event.taskType}${notifyList.length ? ` · notify ${notifyList.join(", ")}` : ""}`);
    setLinkOpen(false);
    clearSelection();
  };

  const unlink = () => {
    if (linkTargetIds.length === 0) return;
    const target = new Set(linkTargetIds);
    setInvoices((prev) => prev.map((inv) => (target.has(inv.id) ? { ...inv, linkedEvent: undefined } : inv)));
    notify("Unlinked", `${linkTargetIds.length} invoice(s)`);
    clearSelection();
  };

  const chosenExistingEvent = useMemo(() => EXISTING_EVENTS.find((e) => e.id === existingEventId) ?? null, [existingEventId]);

  useEffect(() => {
    if (linkMode !== "new") return;
    const nextAuto = makeDefaultTitle({ eventType: linkEventType, taskType: linkTaskType, orderName: firstLinkOrder?.orderName ?? "Order", orderNumber: firstLinkOrder?.orderNumber ?? "" });
    if (!autoTitleSeed || newTitle.trim() !== autoTitleSeed.trim() || nextAuto.trim() === autoTitleSeed.trim()) return;
    setNewTitle(nextAuto);
    setAutoTitleSeed(nextAuto);
  }, [linkEventType, linkTaskType, linkMode, newTitle, autoTitleSeed, firstLinkOrder]);

  const selectionCount = selectedRowIds.size > 0 ? selectedRowIds.size : selectedInvoiceIds.size;
  const needsHoldingSubstatus = holdingStatus !== "None" && String(holdingStatus).includes("has check");

  const uniqueReps = useMemo(() => {
    return Array.from(new Set(ORDERS.map((o) => o.rep))).filter(Boolean).sort();
  }, []);

  const openInvoiceIdSet = useMemo(() => new Set(openInvoices.map((i) => i.id)), [openInvoices]);

  const stageOrderCounts = useMemo(() => {
    const openList = invoices.filter((inv) => inv.balance > 0 && inv.status !== "Paid");
    const depositedList = invoices.filter((inv) => inv.status === "Paid" || inv.balance === 0);
    const uniq = (list: Invoice[]) => new Set(list.map((i) => i.orderId)).size;
    return {
      All: uniq(openList),
      "They have check": uniq(openList.filter((i) => (i.holdingStatus ?? "") === "They have check")),
      "Needs endorsement": uniq(openList.filter((i) => (i.holdingStatus ?? "") === "Needs endorsement")),
      "Pending deposit": uniq(openList.filter((i) => (i.holdingStatus ?? "") === "Pending deposit")),
      Deposited: uniq(depositedList),
    };
  }, [invoices]);

  useEffect(() => {
    setSelectedInvoiceIds((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set<number>();
      prev.forEach((id) => {
        if (openInvoiceIdSet.has(id)) next.add(id);
      });
      return next;
    });
  }, [openInvoiceIdSet]);

  const invoicesByOrderId = useMemo(() => {
    const sorted = [...openInvoices].sort((a, b) => {
      let cmp = 0;
      switch (invoiceSortKey) {
        case "dueDate":
          cmp = safeTime(a.dueDate) - safeTime(b.dueDate);
          break;
        case "billedDate":
          cmp = safeTime(a.billedDate) - safeTime(b.billedDate);
          break;
        case "invoiceNumber":
          cmp = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
        case "amount":
          cmp = a.amount - b.amount;
          break;
        case "balance":
          cmp = a.balance - b.balance;
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return invoiceSortDir === "asc" ? cmp : -cmp;
    });
    return sorted.reduce<Record<number, Invoice[]>>((acc, inv) => {
      (acc[inv.orderId] ??= []).push(inv);
      return acc;
    }, {});
  }, [openInvoices, invoiceSortKey, invoiceSortDir]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    let base = ORDERS.map((o) => {
      const invs = invoicesByOrderId[o.id] ?? [];
      const openBalance = invs.reduce((sum, inv) => sum + inv.balance, 0);
      const primaryStatus = invs[0]?.status ?? "—";
      return { o, invs, openBalance, primaryStatus };
    }).filter((r) => r.invs.length > 0);

    if (s) {
      base = base.filter(({ o, invs }) => {
        const hay = [
          o.orderNumber,
          o.orderName,
          o.billTo,
          o.billToCompany,
          o.nextFollowUpDate ?? "",
          o.rep,
          ...invs.map((x) => x.invoiceNumber),
          ...invs.map((x) => x.type),
          ...invs.map((x) => x.status),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(s);
      });
    }

    base.sort((a, b) => {
      let cmp = 0;
      switch (orderSortKey) {
        case "openBalance":
          cmp = a.openBalance - b.openBalance;
          break;
        case "invoiceCount":
          cmp = a.invs.length - b.invs.length;
          break;
        case "orderName":
          cmp = a.o.orderName.localeCompare(b.o.orderName);
          break;
        case "billTo":
          cmp =
            a.o.billToCompany.localeCompare(b.o.billToCompany) ||
            a.o.billTo.localeCompare(b.o.billTo);
          break;
        case "followUp": {
          const at = safeTimeOrNull(a.o.nextFollowUpDate);
          const bt = safeTimeOrNull(b.o.nextFollowUpDate);
          if (at == null && bt == null) cmp = 0;
          else if (at == null) cmp = 1;
          else if (bt == null) cmp = -1;
          else cmp = at - bt;
          if (orderSortDir === "desc") cmp = -cmp;
          return cmp;
        }
        case "rep":
          cmp = a.o.rep.localeCompare(b.o.rep);
          break;
        case "status":
          cmp = a.primaryStatus.localeCompare(b.primaryStatus);
          break;
      }
      return orderSortDir === "asc" ? cmp : -cmp;
    });

    return base;
  }, [q, invoicesByOrderId, orderSortKey, orderSortDir]);

  const displayRows = useMemo(() => {
    if (focusedOrderId == null) return rows;
    return rows.filter(({ o }) => o.id === focusedOrderId);
  }, [rows, focusedOrderId]);

  const visibleIds = useMemo(() => displayRows.map(({ o }) => o.id), [displayRows]);

  useEffect(() => {
    if (focusedOrderId == null) return;
    if (!rows.some(({ o }) => o.id === focusedOrderId)) setFocusedOrderId(null);
  }, [focusedOrderId, rows]);

  const allVisibleSelected = useMemo(() => {
    return visibleIds.length > 0 && visibleIds.every((id) => selectedRowIds.has(id));
  }, [visibleIds, selectedRowIds]);

  const toggleAllVisible = () => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id: number, checked: boolean) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleInvoice = (invoiceId: number, checked: boolean) => {
    setSelectedInvoiceIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(invoiceId);
      else next.delete(invoiceId);
      return next;
    });
  };

  const toggleAllInvoices = (invoiceIds: number[], allSelected: boolean) => {
    setSelectedInvoiceIds((prev) => {
      const next = new Set(prev);
      if (allSelected) invoiceIds.forEach((id) => next.delete(id));
      else invoiceIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const collapseAll = () => {
    const m: Record<number, boolean> = {};
    rows.forEach(({ o }) => (m[o.id] = true));
    setCollapsedByOrder(m);
    setFocusedOrderId(null);
  };

  const expandAll = () => {
    const m: Record<number, boolean> = {};
    rows.forEach(({ o }) => (m[o.id] = false));
    setCollapsedByOrder(m);
    setFocusedOrderId(null);
  };

  const sortIndicator = (key: OrderSortKey) => {
    if (orderSortKey !== key) return null;
    return orderSortDir === "asc" ? "↑" : "↓";
  };

  const handleOrderSort = (key: OrderSortKey) => {
    if (orderSortKey === key) {
      setOrderSortDir((p) => (p === "asc" ? "desc" : "asc"));
      return;
    }
    setOrderSortKey(key);
    setOrderSortDir(key === "openBalance" || key === "invoiceCount" ? "desc" : "asc");
  };

  const toggleOrder = (id: number, currentlyCollapsed: boolean) => {
    if (currentlyCollapsed) {
      setCollapsedByOrder((p) => {
        const next: Record<number, boolean> = { ...p };
        rows.forEach(({ o }) => {
          if (o.id !== id) next[o.id] = true;
        });
        next[id] = false;
        return next;
      });
      setFocusedOrderId(id);
    } else {
      setCollapsedByOrder((p) => ({ ...p, [id]: true }));
      setFocusedOrderId(null);
    }
  };

  const anySelection = selectedRowIds.size > 0 || selectedInvoiceIds.size > 0;

  const clearSelection = () => {
    setSelectedRowIds(new Set());
    setSelectedInvoiceIds(new Set());
  };

  const stagePills: { value: StageFilterValue; label: string }[] = [
    { value: "All", label: "Open Invoices" },
    { value: "They have check", label: "They have check" },
    { value: "Needs endorsement", label: "Needs endorsement" },
    { value: "Pending deposit", label: "Pending deposit" },
    { value: "Deposited", label: "Deposited" },
  ];

  return (
    <div className="space-y-4 pb-28">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {stagePills.map(({ value, label }) => {
              const count = stageOrderCounts[value];
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStageFilter(value)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    stageFilter === value
                      ? "border-sky-600 bg-sky-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums ${
                      stageFilter === value ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    } ${count === 0 ? "opacity-60" : ""}`}
                    title={`${count} order${count === 1 ? "" : "s"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={collapseAll}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Collapse all
            </button>
            <button
              type="button"
              onClick={expandAll}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen((p) => !p)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              aria-label="Open filters"
              aria-expanded={filtersOpen}
              aria-controls="filters-panel"
              title="Filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>

          {filtersOpen && (
            <div
              id="filters-panel"
              className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Filters
                </div>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                  aria-label="Close filters"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rep
                  </span>
                  {repFilter !== "All" && (
                    <div className={repBadgeClasses(repFilter)}>{repFilter}</div>
                  )}
                  <select
                    className="bg-transparent text-xs text-slate-800 focus:outline-none"
                    value={repFilter}
                    onChange={(e) => setRepFilter(e.target.value)}
                  >
                    <option value="All">All</option>
                    {uniqueReps.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </span>
                  <select
                    className="bg-transparent text-xs text-slate-800 focus:outline-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | "All")}
                  >
                    <option value="All">All</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                    <option value="Disputed">Disputed</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Invoice sort
                  </span>
                  <select
                    className="bg-transparent text-xs text-slate-800 focus:outline-none"
                    value={invoiceSortKey}
                    onChange={(e) => setInvoiceSortKey(e.target.value as InvoiceSortKey)}
                  >
                    <option value="dueDate">Due date</option>
                    <option value="billedDate">Billed date</option>
                    <option value="invoiceNumber">Invoice #</option>
                    <option value="balance">Balance</option>
                    <option value="amount">Amount</option>
                    <option value="status">Status</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setInvoiceSortDir((p) => (p === "asc" ? "desc" : "asc"))}
                    className="rounded px-1 text-xs text-slate-600 hover:text-slate-900"
                    aria-label="Toggle invoice sort direction"
                  >
                    {invoiceSortDir === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStageFilter("All");
                    setRepFilter("All");
                    setStatusFilter("All");
                  }}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Clear filters
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="rounded-md bg-sky-700 px-2 py-1 text-xs font-medium text-white hover:bg-sky-800"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <Card className="border-slate-200 bg-white">
        <CardContent className="p-0">
          {displayRows.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No open invoices match your filters/search.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg">
              <div className="grid grid-cols-[32px_28px_minmax(0,4fr)_minmax(0,2fr)_52px_46px_minmax(80px,1fr)_minmax(72px,0.9fr)_minmax(90px,1fr)] gap-x-1.5 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div className="flex items-center justify-center">
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={() => toggleAllVisible()}
                      aria-label="Select all"
                      className="h-3.5 w-3.5 rounded border-slate-300 accent-sky-700"
                    />
                  </div>
                </div>
                <div />
                <button
                  type="button"
                  onClick={() => handleOrderSort("orderName")}
                  className="text-left hover:text-slate-800"
                >
                  Order {sortIndicator("orderName")}
                </button>
                <button
                  type="button"
                  onClick={() => handleOrderSort("billTo")}
                  className="text-left hover:text-slate-800"
                >
                  Bill to {sortIndicator("billTo")}
                </button>
                <button
                  type="button"
                  onClick={() => handleOrderSort("rep")}
                  className="text-center hover:text-slate-800"
                >
                  Rep {sortIndicator("rep")}
                </button>
                <button
                  type="button"
                  onClick={() => handleOrderSort("invoiceCount")}
                  className="text-center hover:text-slate-800"
                >
                  Open {sortIndicator("invoiceCount")}
                </button>
                <button
                  type="button"
                  onClick={() => handleOrderSort("openBalance")}
                  className="text-right hover:text-slate-800"
                >
                  Balance {sortIndicator("openBalance")}
                </button>
                <button
                  type="button"
                  onClick={() => handleOrderSort("status")}
                  className="text-left hover:text-slate-800"
                >
                  Status {sortIndicator("status")}
                </button>
                <button
                  type="button"
                  onClick={() => handleOrderSort("followUp")}
                  className="flex items-center gap-1 text-left hover:text-slate-800"
                >
                  <Bell className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Reminder {sortIndicator("followUp")}
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {displayRows.map(({ o, invs, openBalance, primaryStatus }) => {
                  const collapsed = collapsedByOrder[o.id] ?? true;
                  const isSelected = selectedRowIds.has(o.id);
                  const invIds = invs.map((x) => x.id);
                  const allInvSelected =
                    invIds.length > 0 && invIds.every((id) => selectedInvoiceIds.has(id));

                  return (
                    <div key={o.id} className="px-3 py-1.5">
                      <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleOrder(o.id, collapsed);
                          }
                        }}
                        className={`grid w-full grid-cols-[32px_28px_minmax(0,4fr)_minmax(0,2fr)_52px_46px_minmax(80px,1fr)_minmax(72px,0.9fr)_minmax(90px,1fr)] items-center gap-x-1.5 rounded-md py-1.5 text-left hover:bg-slate-50 ${
                          isSelected ? "bg-sky-50" : ""
                        }`}
                        onClick={() => toggleOrder(o.id, collapsed)}
                      >
                        <div
                          className="flex items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleOne(o.id, e.target.checked)}
                            aria-label={`Select ${o.orderName}`}
                            className="h-3.5 w-3.5 rounded border-slate-300 accent-sky-700"
                          />
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-50 text-sky-700">
                            <ChevronRight
                              className={`h-3.5 w-3.5 transition-transform ${collapsed ? "" : "rotate-90"}`}
                            />
                          </div>
                        </div>
                        <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
                          {onOrderNameClick ? (
                            <button
                              type="button"
                              onClick={() => onOrderNameClick(o)}
                              className="group flex max-w-full items-baseline truncate text-left text-sm font-semibold tabular-nums text-sky-800 hover:text-sky-900"
                            >
                              <span className="truncate">{o.orderName}</span>
                              <span className="ml-2 shrink-0 text-xs font-medium text-slate-500 group-hover:text-slate-600">
                                ({o.orderNumber})
                              </span>
                            </button>
                          ) : (
                            <div className="truncate text-sm font-semibold tabular-nums text-slate-900">
                              {o.orderName}
                              <span className="ml-2 text-xs font-medium text-slate-500">
                                ({o.orderNumber})
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold text-slate-900">
                            {o.billToCompany}
                          </div>
                          <div className="truncate text-xs text-slate-600">{o.billTo}</div>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className={repBadgeClasses(o.rep)}>{o.rep}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-medium text-slate-700">
                            {invs.length}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-slate-900">
                            {formatCurrency(openBalance)}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-medium text-slate-700">
                            {primaryStatus}
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-medium text-slate-700">
                            {o.nextFollowUpDate
                              ? formatShortDate(o.nextFollowUpDate)
                              : "—"}
                          </div>
                        </div>
                      </div>

                      {!collapsed && (
                        <div className="mt-3 overflow-hidden rounded-md border border-sky-200 bg-sky-50">
                          <div className="grid grid-cols-[36px_1fr_1fr_0.75fr_0.85fr_0.85fr_minmax(90px,1.15fr)_minmax(0,2fr)] gap-x-3 gap-y-1 border-b border-sky-200 bg-sky-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-sky-900">
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={allInvSelected}
                                onChange={() =>
                                  toggleAllInvoices(invIds, allInvSelected)
                                }
                                aria-label="Select all invoices"
                                className="h-4 w-4 rounded border-slate-300 accent-sky-700"
                              />
                            </div>
                            <div>Date</div>
                            <div>Invoice</div>
                            <div>Type</div>
                            <div className="text-right">Amount</div>
                            <div className="text-right">Balance</div>
                            <div>Status</div>
                            <div>Notes</div>
                          </div>
                          {invs.map((inv, idx) => {
                            const pastDueDays = daysSince(inv.dueDate);
                            const meta = agingMeta(pastDueDays);
                            const invSelected = selectedInvoiceIds.has(inv.id);
                            return (
                              <div
                                key={inv.id}
                                className={`grid grid-cols-[36px_1fr_1fr_0.75fr_0.85fr_0.85fr_minmax(90px,1.15fr)_minmax(0,2fr)] gap-x-3 gap-y-1 px-3 py-2 text-xs ${
                                  idx % 2 === 0 ? "bg-sky-50" : "bg-sky-100"
                                } ${invSelected ? "ring-1 ring-sky-300" : ""}`}
                              >
                                <div className="flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={invSelected}
                                    onChange={(e) =>
                                      toggleInvoice(inv.id, e.target.checked)
                                    }
                                    aria-label={`Select ${inv.invoiceNumber}`}
                                    className="h-4 w-4 rounded border-slate-300 accent-sky-700"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-sky-900">
                                    {formatShortDate(inv.billedDate)}
                                  </span>
                                  <span className="text-xs text-sky-700">
                                    Due {formatShortDate(inv.dueDate)}
                                  </span>
                                </div>
                                <div className="font-medium text-sky-900">
                                  {inv.invoiceNumber}
                                </div>
                                <div className="text-sky-900">{inv.type}</div>
                                <div className="text-right text-sky-900">
                                  {formatCurrency(inv.amount)}
                                </div>
                                <div className="text-right font-semibold text-sky-900">
                                  {formatCurrency(inv.balance)}
                                </div>
                                <div className="min-w-0 flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`shrink-0 inline-block h-3 w-3 rounded-full ${meta.color}`}
                                    />
                                    <span className="truncate text-sky-900">{inv.status}</span>
                                  </div>
                                  <div className="text-xs text-sky-800">
                                    {meta.label}
                                  </div>
                                </div>
                                {inv.lastNote ? (
                                  <div className="text-xs text-sky-800">
                                    {inv.lastNote}
                                  </div>
                                ) : (
                                  <div className="text-xs text-sky-600">—</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-slate-500">
        Aging is calculated from invoice{" "}
        <span className="font-medium">due date</span> (simplified).
      </div>

      {anySelection && (
        <div className="fixed bottom-6 left-1/2 z-20 w-[min(980px,calc(100vw-1.5rem))] -translate-x-1/2 rounded-2xl border border-sky-800 bg-sky-900 p-2 shadow-xl">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <div className="whitespace-nowrap pl-2 pr-1 text-xs font-semibold text-white">
              {selectionCount} selected
            </div>
            <div className="min-w-0">
              <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto px-1 py-0.5">
                <Button size="sm" variant="ghost" className="h-8 rounded-full px-2.5 text-xs text-sky-100 hover:bg-sky-800 hover:text-white" onClick={() => setDisputeOpen(true)}>
                  <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                  Dispute
                </Button>
                <Button size="sm" variant="ghost" className="h-8 rounded-full px-2.5 text-xs text-sky-100 hover:bg-sky-800 hover:text-white" onClick={() => setAuditOpen(true)}>
                  <FileText className="mr-2 h-3.5 w-3.5" />
                  Audit
                </Button>
                <Button size="sm" variant="ghost" className="h-8 rounded-full px-2.5 text-xs text-sky-100 hover:bg-sky-800 hover:text-white" onClick={openStatusDialog}>
                  <Tag className="mr-2 h-3.5 w-3.5" />
                  Status
                </Button>
                <Button size="sm" variant="ghost" className="h-8 rounded-full px-2.5 text-xs text-sky-100 hover:bg-sky-800 hover:text-white">
                  <DollarSign className="mr-2 h-3.5 w-3.5" />
                  Receive
                </Button>
                <Button size="sm" variant="ghost" className="h-8 rounded-full px-2.5 text-xs text-sky-100 hover:bg-sky-800 hover:text-white">
                  <Mail className="mr-2 h-3.5 w-3.5" />
                  Email
                </Button>
                <Button size="sm" variant="ghost" className="h-8 rounded-full px-2.5 text-xs text-sky-100 hover:bg-sky-800 hover:text-white">
                  <MessageSquare className="mr-2 h-3.5 w-3.5" />
                  Text
                </Button>
                <Button size="sm" variant="ghost" className="h-8 rounded-full px-2.5 text-xs text-sky-100 hover:bg-sky-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={selectionCount > 1}>
                  <Phone className="mr-2 h-3.5 w-3.5" />
                  Call
                </Button>
                <Button size="sm" variant="ghost" className="h-8 rounded-full px-2.5 text-xs text-sky-100 hover:bg-sky-800 hover:text-white">
                  <Zap className="mr-2 h-3.5 w-3.5" />
                  Auto
                </Button>
                <Button size="sm" variant="ghost" className="h-8 rounded-full px-2.5 text-xs text-sky-100 hover:bg-sky-800 hover:text-white" onClick={() => openLinkDialog("existing")}>
                  <Link2 className="mr-2 h-3.5 w-3.5" />
                  Link to event
                </Button>
                <Button size="sm" variant="ghost" className="h-8 rounded-full px-2.5 text-xs text-sky-100 hover:bg-sky-800 hover:text-white" onClick={unlink}>
                  <Link2 className="mr-2 h-3.5 w-3.5" />
                  Unlink
                </Button>
              </div>
            </div>
            <div className="relative flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full p-0 text-sky-100 hover:bg-sky-800 hover:text-white" onClick={() => setBulkMenuOpen((v) => !v)} aria-label="More actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {bulkMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 rounded-lg border border-sky-800 bg-sky-950 p-1 shadow-xl">
                  <button type="button" className="flex w-full items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-900 hover:text-white" onClick={() => { setMarkPaidOpen(true); setBulkMenuOpen(false); }}>
                    <CheckCircle2 className="h-4 w-4" />
                    Mark paid…
                  </button>
                  <button type="button" className="mt-1 flex w-full items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-900 hover:text-white" onClick={() => setBulkMenuOpen(false)}>
                    <Zap className="h-4 w-4" />
                    Toggle Auto FU
                  </button>
                </div>
              )}
              <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full p-0 text-sky-100 hover:bg-sky-800 hover:text-white" onClick={clearSelection} aria-label="Clear selection">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update status</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-xs text-slate-600">Selected</div>
              <div className="text-sm font-semibold text-slate-900">
                {selectedInvoiceIds.size > 0
                  ? `${selectedInvoiceIds.size} invoice${selectedInvoiceIds.size === 1 ? "" : "s"}`
                  : `${selectedRowIds.size} order${selectedRowIds.size === 1 ? "" : "s"}`}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600">Status</Label>
              <select
                value={holdingStatus}
                onChange={(e) => setHoldingStatus(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="None">— None —</option>
                <option value="Needs endorsement">Needs endorsement</option>
                <option value="PA has check">PA has check</option>
                <option value="Customer has check">Customer has check</option>
                <option value="Other has check">Other has check</option>
              </select>
            </div>
            {needsHoldingSubstatus && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Sub-status</Label>
                <select
                  value={holdingSubstatus}
                  onChange={(e) => setHoldingSubstatus(e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="Mailing">Mailing</option>
                  <option value="Pickup">Pickup</option>
                  <option value="Bring in">Bring in</option>
                  <option value="No response">No response</option>
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Reminder date</Label>
                <Input type="date" value={statusReminder} onChange={(e) => setStatusReminder(e.target.value)} className="h-9 rounded-md border border-slate-200 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Note</Label>
                <Input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Optional…" className="h-9 rounded-md border border-slate-200 text-xs" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input type="checkbox" checked={statusAutoFU} onChange={(e) => setStatusAutoFU(e.target.checked)} className="h-4 w-4 accent-sky-700" />
                <span className="inline-flex items-center gap-1">Auto FU <Zap className="h-3.5 w-3.5 text-sky-700" /></span>
              </label>
              <div className="text-xs text-slate-500">{statusAutoFU ? "On" : "Off"}</div>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button type="button" size="sm" className="bg-sky-700 text-white hover:bg-sky-800" onClick={() => applyStatus(false)}>Update</Button>
            <Button type="button" size="sm" className="bg-sky-700 text-white hover:bg-sky-800" onClick={() => applyStatus(true)}>Update + add to event</Button>
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
                  <div className="text-xs text-slate-600">Selected</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {linkTargetIds.length} invoice{linkTargetIds.length === 1 ? "" : "s"}
                  </div>
                  {firstLinkOrder && (
                    <div className="text-xs text-slate-600">
                      {firstLinkOrder.orderName} <span className="font-medium">({firstLinkOrder.orderNumber})</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`flex-1 rounded-md border px-3 py-2 text-xs font-semibold transition ${linkMode === "existing" ? "border-sky-200 bg-sky-50 text-sky-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                    onClick={() => setLinkMode("existing")}
                  >
                    Link existing
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-md border px-3 py-2 text-xs font-semibold transition ${linkMode === "new" ? "border-sky-200 bg-sky-50 text-sky-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                    onClick={() => setLinkMode("new")}
                  >
                    Create new
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600">Task</Label>
                    <select value={linkTaskType} onChange={(e) => setLinkTaskType(e.target.value as TaskType)} className={SELECT_CLS}>
                      {TASK_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600">Event type</Label>
                    {linkMode === "existing" && chosenExistingEvent ? (
                      <select value={chosenExistingEvent.eventType} disabled className={SELECT_CLS}>
                        {EVENT_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    ) : (
                      <select value={linkEventType} onChange={(e) => setLinkEventType(e.target.value as EventType)} className={SELECT_CLS}>
                        {EVENT_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {linkMode === "existing" ? (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600">Choose event</Label>
                    <select value={existingEventId} onChange={(e) => setExistingEventId(e.target.value)} className={SELECT_CLS}>
                      {EXISTING_EVENTS.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.eventType} · {ev.title}</option>
                      ))}
                    </select>
                    {chosenExistingEvent && (
                      <div className="text-xs text-slate-600">Starts: {formatShortDateTime(chosenExistingEvent.startISO)}</div>
                    )}
                    <div className="text-xs text-slate-500">
                      Reminder rule: we’ll set the reminder to the event date unless there’s already an earlier reminder.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">Title</Label>
                      <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className={INPUT_CLS} placeholder="Event title" />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600">When</Label>
                        <Input value={newWhen} onChange={(e) => setNewWhen(e.target.value)} type="datetime-local" className={INPUT_CLS} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600">Location</Label>
                        <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className={INPUT_CLS} placeholder="Optional" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">Details</Label>
                      <Input value={newDetails} onChange={(e) => setNewDetails(e.target.value)} className={INPUT_CLS} placeholder="Optional" />
                    </div>
                    <div className="text-xs text-slate-500">
                      Reminder rule: we’ll set the reminder to the event date unless there’s already an earlier reminder.
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" />
                    <Label className="text-xs font-semibold text-slate-600">Notify coworkers</Label>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition ${notifyIds.size === 0 ? "border-sky-500 bg-sky-50 text-sky-900" : "border-slate-200 bg-white text-slate-700 hover:border-sky-300"}`}
                      onClick={() => setNotifyIds(new Set())}
                    >
                      None
                    </button>
                    {COWORKERS.map((c) => {
                      const selected = notifyIds.has(c.id);
                      const initials = coworkerInitials(c.id);
                      const showName = c.name.trim().toUpperCase() !== initials;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition ${selected ? "border-sky-500 bg-sky-50 text-sky-900" : "border-slate-200 bg-white text-slate-700 hover:border-sky-300"}`}
                          onClick={() => setNotifyIds((prev) => { const next = new Set(prev); if (next.has(c.id)) next.delete(c.id); else next.add(c.id); return next; })}
                        >
                          <span className={coworkerBadgeClasses(c.id)} aria-hidden="true">{initials}</span>
                          {showName ? <span className="whitespace-nowrap text-xs font-semibold">{c.name}</span> : null}
                          {c.role ? <span className="whitespace-nowrap text-xs text-slate-500">· {c.role}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                  {notifyIds.size > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                      <span className="font-medium">Notify:</span>
                      {Array.from(notifyIds).map((id) => (
                        <span key={id} className={coworkerBadgeClassesSm(id)} title={coworkerLabel(id)}>{coworkerInitials(id)}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                  Default: <span className="font-semibold text-slate-900">{defaultTaskTypeForInvoice(firstLinkInvoice)}</span>
                  <span className="mx-2 text-slate-300">·</span>
                  Current reminder: <span className="font-semibold text-slate-900">{firstLinkInvoice?.reminderDate ? formatShortDate(firstLinkInvoice.reminderDate) : "—"}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setLinkOpen(false)}>Cancel</Button>
              <Button
                type="button"
                size="sm"
                className="bg-sky-700 text-white hover:bg-sky-800"
                onClick={applyLink}
                disabled={linkMode === "existing" ? !existingEventId : !newTitle.trim() || !newWhen.trim()}
              >
                Link
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disputeOpen} onOpenChange={(open) => { setDisputeOpen(open); if (!open) setDisputeMode("open"); }}>
        <DialogContent className="max-w-[92vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dispute</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-xs text-slate-600">Selected</div>
              <div className="text-sm font-semibold text-slate-900">{selectionCount} invoice{selectionCount === 1 ? "" : "s"}</div>
            </div>
            <div className="inline-flex w-full rounded-md border border-slate-200 bg-white p-1">
              <button type="button" onClick={() => setDisputeMode("open")} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${disputeMode === "open" ? "bg-sky-700 text-white" : "text-slate-700 hover:bg-slate-50"}`}>Open / update</button>
              <button type="button" onClick={() => setDisputeMode("resolve")} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${disputeMode === "resolve" ? "bg-sky-700 text-white" : "text-slate-700 hover:bg-slate-50"}`}>Resolve</button>
            </div>
            {disputeMode === "open" ? (
              <>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-600">Dispute type</Label>
                  <select className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs">
                    <option>Disputing amount</option>
                    <option>Disputing that they owe us</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-600">Details</Label>
                  <Input placeholder="Optional notes…" className="h-9 rounded-md border border-slate-200 text-xs" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-600">Outcome</Label>
                  <select className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs">
                    <option>Balance Due</option>
                    <option>Paid</option>
                    <option>Credit Issued</option>
                    <option>Write-off</option>
                    <option>Send back to billing</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-600">Reason</Label>
                  <Input placeholder="Optional notes…" className="h-9 rounded-md border border-slate-200 text-xs" />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDisputeOpen(false)}>Cancel</Button>
            <Button type="button" size="sm" className="bg-sky-700 text-white hover:bg-sky-800" onClick={() => { notify("Updated dispute", `${selectionCount} invoice(s)`); setDisputeOpen(false); clearSelection(); }}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={auditOpen} onOpenChange={(open) => { setAuditOpen(open); if (!open) setAuditMode("update"); }}>
        <DialogContent className="max-w-[92vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Audit</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-xs text-slate-600">Selected</div>
              <div className="text-sm font-semibold text-slate-900">{selectionCount} invoice{selectionCount === 1 ? "" : "s"}</div>
            </div>
            <div className="inline-flex w-full rounded-md border border-slate-200 bg-white p-1">
              <button type="button" onClick={() => setAuditMode("update")} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${auditMode === "update" ? "bg-sky-700 text-white" : "text-slate-700 hover:bg-slate-50"}`}>Open / update</button>
              <button type="button" onClick={() => setAuditMode("resolve")} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${auditMode === "resolve" ? "bg-sky-700 text-white" : "text-slate-700 hover:bg-slate-50"}`}>Close</button>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600">Audit company *</Label>
              <Input placeholder="Wardlaw" className="h-9 rounded-md border border-slate-200 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600">Contact *</Label>
              <Input placeholder="John Doe" className="h-9 rounded-md border border-slate-200 text-xs" />
            </div>
            {auditMode === "update" && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Status</Label>
                <select className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs">
                  <option>Open</option>
                  <option>Billing</option>
                </select>
              </div>
            )}
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAuditOpen(false)}>Cancel</Button>
            <Button type="button" size="sm" className="bg-sky-700 text-white hover:bg-sky-800" onClick={() => { notify(auditMode === "resolve" ? "Audit closed" : "Audit updated", `${selectionCount} invoice(s)`); setAuditOpen(false); clearSelection(); }}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark paid</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-xs">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-xs text-slate-600">Selected</div>
              <div className="text-sm font-semibold text-slate-900">{selectionCount} invoice{selectionCount === 1 ? "" : "s"}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600">Reason *</Label>
              <Input value={markPaidReason} onChange={(e) => setMarkPaidReason(e.target.value)} placeholder="e.g., Accounting posted / paid outside system" className="h-9 rounded-md border border-slate-200 text-xs" />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setMarkPaidOpen(false)}>Cancel</Button>
            <Button type="button" size="sm" className="bg-sky-700 text-white hover:bg-sky-800" onClick={() => { if (markPaidReason.trim()) { notify("Marked paid", `${selectionCount} invoice(s)`); setMarkPaidOpen(false); clearSelection(); } }}>Mark paid</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-[320px] rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
          <div className="text-xs font-semibold text-slate-900">{toast.title}</div>
          {toast.message && <div className="mt-0.5 text-xs text-slate-600">{toast.message}</div>}
          <button
            type="button"
            className="absolute right-2 top-2 rounded p-1 text-slate-500 hover:text-slate-700"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
