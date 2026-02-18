import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Send,
  SlidersHorizontal,
  Wrench,
  X,
} from "lucide-react";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { useGlobalSearch } from "@/contexts/GlobalSearchContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/RepAvatar";

const EVENT_TYPE_OPTIONS = [
  "",
  "Pickup",
  "Inhome",
  "Delivery",
  "Packout",
  "Assessment",
  "Final Walkthrough",
  "Inspection",
  "Reinstall",
] as const;

const SERVICE_TYPE_SUGGESTIONS = [
  "Packout labor",
  "Unpack and delivery",
  "Contents cleaning",
  "Ozone room",
  "Storage monthly",
  "Wardrobe Boxes",
  "Bubble Wrap- per half roll",
  "Box pack materials",
  "Furniture Moving Truck (16'-20')",
  "Scotch Guard Rugs (Sq/Ft)",
  "Air Mover (per 24 hour period)",
  "Dehumidifier (per 24 hour period)",
  "Service Time (Packout)",
  "Service Time (Unpack Delivery)",
  "Service Time (Project Mgmt)",
  "Service Time (Fabric Cleaning - Tech)",
  "Service Time (Photo Inventory - Tech)",
  "Service Time (Electronics - Tech)",
  "Electronics decontamination",
  "Contents inventory software fee",
  "Mileage / travel",
] as const;

type BillingStatus = "Unbilled" | "Ready to Bill" | "Billed" | "Paid";

type ServiceRow = {
  id: number;
  orderNumber: string;
  orderName: string;
  billTo: string;
  date: string;
  user?: string;
  event?: string;
  eventId?: string;
  service: string;
  quantity: number;
  amount: number;
  billingStatus: BillingStatus;
  note?: string;
  excluded?: boolean;
};

type ServiceDraft = {
  id?: number;
  orderNumber: string;
  orderName: string;
  billTo: string;
  date: string;
  user: string;
  event: string;
  eventId?: string;
  service: string;
  quantity: string;
  amount: string;
  billingStatus: BillingStatus;
  note: string;
  excluded: boolean;
};

const INITIAL_SERVICES: ServiceRow[] = [
  { id: 1, orderNumber: "1250037", orderName: "Cotton-HackettstownNJ", billTo: "Gemini Restoration Inc.", date: "2025-11-10", event: "Packout", eventId: "ev-1", service: "Packout labor", quantity: 12, amount: 1850, billingStatus: "Ready to Bill", note: "Day 1 and 2 packout crew" },
  { id: 2, orderNumber: "1250679", orderName: "Winterroth-YonkersNY", billTo: "Cleaning Co - German Arana", date: "2025-11-05", user: "German Arana", event: "Inhome", eventId: "ev-2", service: "Ozone room", quantity: 5, amount: 975, billingStatus: "Unbilled", note: "Closets and soft goods only" },
  { id: 3, orderNumber: "1240703", orderName: "Lee-SomersetNJ", billTo: "All States Restoration", date: "2025-10-28", event: "Inhome", eventId: "ev-3", service: "Contents cleaning", quantity: 18, amount: 6425.25, billingStatus: "Billed", note: "Main floor and basement contents" },
  { id: 4, orderNumber: "1250220", orderName: "Parry-NewYorkNY", billTo: "Cleaning Co - Lamar Townes", date: "2025-11-15", user: "Lamar Townes", event: "Pickup", eventId: "ev-4", service: "Storage monthly", quantity: 1, amount: 275, billingStatus: "Ready to Bill", note: "Warehouse Bay 4 storage" },
  { id: 5, orderNumber: "1250818", orderName: "Schor-ChalfontPA", billTo: "Mark 1 Restoration / ATI", date: "2025-11-18", event: "Delivery", eventId: "ev-5", service: "Unpack and delivery", quantity: 2, amount: 1320, billingStatus: "Unbilled", note: "Final delivery and placement" },
  { id: 6, orderNumber: "1250037", orderName: "Cotton-HackettstownNJ", billTo: "Gemini Restoration Inc.", date: "2025-11-10", user: "A. Cotton", event: "Packout", eventId: "ev-1", service: "Service Time (Packout)", quantity: 10, amount: 570, billingStatus: "Billed", note: "Field crew packout hours from standard rate sheet" },
  { id: 7, orderNumber: "1250037", orderName: "Cotton-HackettstownNJ", billTo: "Gemini Restoration Inc.", date: "2025-11-10", user: "A. Cotton", event: "Packout", eventId: "ev-1", service: "Wardrobe Boxes", quantity: 6, amount: 201, billingStatus: "Billed", note: "Hanging garments packed to go to plant" },
  { id: 8, orderNumber: "1250679", orderName: "Winterroth-YonkersNY", billTo: "Cleaning Co - German Arana", date: "2025-11-05", user: "German Arana", event: "Inhome", eventId: "ev-2", service: "Service Time (HepaVac Soft Goods - Tech)", quantity: 8, amount: 712.8, billingStatus: "Ready to Bill", note: "HepaVac of soft goods in staging area" },
  { id: 9, orderNumber: "1250679", orderName: "Winterroth-YonkersNY", billTo: "Cleaning Co - German Arana", date: "2025-11-05", user: "German Arana", event: "Inhome", eventId: "ev-2", service: "Bubble Wrap- per half roll", quantity: 3, amount: 90, billingStatus: "Unbilled", note: "Glassware and decor protection" },
  { id: 10, orderNumber: "1240703", orderName: "Lee-SomersetNJ", billTo: "All States Restoration", date: "2025-10-28", user: "E. Lee", event: "Inhome", eventId: "ev-3", service: "Service Time (Fabric Cleaning - Tech)", quantity: 12, amount: 1069.2, billingStatus: "Billed", note: "On-site fabric cleaning hours" },
  { id: 11, orderNumber: "1240703", orderName: "Lee-SomersetNJ", billTo: "All States Restoration", date: "2025-10-28", user: "E. Lee", event: "Inhome", eventId: "ev-3", service: "Service Time (Photo Inventory - Tech)", quantity: 4, amount: 356.4, billingStatus: "Billed", note: "Photo documentation for high-value items" },
  { id: 12, orderNumber: "1250220", orderName: "Parry-NewYorkNY", billTo: "Cleaning Co - Lamar Townes", date: "2025-11-15", user: "Lamar Townes", event: "Pickup", eventId: "ev-4", service: "Scotch Guard Rugs (Sq/Ft)", quantity: 400, amount: 1000, billingStatus: "Ready to Bill", note: "Protective treatment for area rugs" },
  { id: 13, orderNumber: "1250220", orderName: "Parry-NewYorkNY", billTo: "Cleaning Co - Lamar Townes", date: "2025-11-15", user: "Lamar Townes", event: "Pickup", eventId: "ev-4", service: "Furniture Moving Truck (16'-20')", quantity: 2, amount: 364, billingStatus: "Ready to Bill", note: "Truck usage for packout and return trip" },
  { id: 14, orderNumber: "1250818", orderName: "Schor-ChalfontPA", billTo: "Mark 1 Restoration / ATI", date: "2025-11-18", user: "Schor", event: "Assessment", eventId: "ev-6", service: "Air Mover (per 24 hour period)", quantity: 6, amount: 231, billingStatus: "Unbilled", note: "Air movers used during on-site dry down" },
  { id: 15, orderNumber: "1250818", orderName: "Schor-ChalfontPA", billTo: "Mark 1 Restoration / ATI", date: "2025-11-18", user: "Schor", event: "Delivery", eventId: "ev-5", service: "Service Time (Unpack Delivery)", quantity: 3, amount: 171, billingStatus: "Unbilled", note: "Crew time to unpack and place contents" },
  { id: 16, orderNumber: "1250037", orderName: "Cotton-HackettstownNJ", billTo: "Gemini Restoration Inc.", date: "2025-11-11", user: "A. Cotton", event: "Packout", eventId: "ev-7", service: "Box pack materials", quantity: 20, amount: 140, billingStatus: "Ready to Bill", note: "Tape, paper, dish packs" },
  { id: 17, orderNumber: "1250679", orderName: "Winterroth-YonkersNY", billTo: "Cleaning Co - German Arana", date: "2025-11-06", user: "German Arana", service: "Dehumidifier (per 24 hour period)", quantity: 2, amount: 92, billingStatus: "Unbilled", note: "Small unit - 2 days" },
  { id: 18, orderNumber: "1250220", orderName: "Parry-NewYorkNY", billTo: "Cleaning Co - Lamar Townes", date: "2025-11-16", user: "Lamar Townes", event: "Final Walkthrough", eventId: "ev-8", service: "Service Time (Project Mgmt)", quantity: 3, amount: 267.3, billingStatus: "Ready to Bill", note: "Coordination + updates" },
  { id: 19, orderNumber: "1250818", orderName: "Schor-ChalfontPA", billTo: "Mark 1 Restoration / ATI", date: "2025-11-19", user: "Schor", service: "Contents inventory software fee", quantity: 1, amount: 125, billingStatus: "Unbilled", note: "Per-job platform fee" },
  { id: 20, orderNumber: "1250901", orderName: "Rossi-BrooklynNY", billTo: "BlueSky Restoration", date: "2025-11-22", user: "Sal Rossi", event: "Inhome", eventId: "ev-9", service: "Electronics decontamination", quantity: 4, amount: 880, billingStatus: "Ready to Bill", note: "Console + small electronics" },
  { id: 21, orderNumber: "1250901", orderName: "Rossi-BrooklynNY", billTo: "BlueSky Restoration", date: "2025-11-22", user: "Sal Rossi", event: "Inhome", eventId: "ev-9", service: "Service Time (Electronics - Tech)", quantity: 6, amount: 534.6, billingStatus: "Ready to Bill", note: "Bench cleaning + testing" },
  { id: 22, orderNumber: "1250901", orderName: "Rossi-BrooklynNY", billTo: "BlueSky Restoration", date: "2025-11-22", user: "Sal Rossi", event: "Inhome", eventId: "ev-9", service: "Mileage / travel", quantity: 1, amount: 45, billingStatus: "Ready to Bill", excluded: true, note: "Excluded for goodwill" },
];

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type CalendarEventDetails = {
  id: string;
  type: string;
  date: string;
  time: string;
  orderNumber: string;
  orderName: string;
  assignee?: string;
  attendees: string[];
  statusSummary: string;
  metrics?: string;
  address?: string;
  notes?: string;
};

function getEventDetails(
  eventId: string | undefined,
  eventType: string | undefined,
  orderNumber: string,
  orderName: string,
  date: string
): CalendarEventDetails | null {
  if (!eventId && !eventType) return null;
  const type = eventType || "Event";
  const base: CalendarEventDetails = {
    id: eventId || "—",
    type,
    date,
    time: "9:00 AM – 12:00 PM",
    orderNumber,
    orderName,
    assignee: "Field lead",
    attendees: ["Field lead"],
    statusSummary: "Scheduled",
    metrics: undefined,
    address: "123 Service Address, City, ST 12345",
    notes: "Calendar event linked to this service line.",
  };

  switch (type) {
    case "Pickup": {
      base.assignee = "Pickup crew lead";
      base.attendees = ["Pickup crew lead", "Helper A", "Helper B"];
      base.statusSummary = "Completed";
      base.metrics = "42 containers picked up • 3 rooms cleared";
      break;
    }
    case "Inhome": {
      base.assignee = "Onsite tech";
      base.attendees = ["Onsite tech", "Helper"];
      base.statusSummary = "In progress";
      base.metrics = "120 items cleaned • $8,450 service value";
      break;
    }
    case "Delivery": {
      base.assignee = "Delivery lead";
      base.attendees = ["Delivery lead", "Driver"];
      base.statusSummary = "Completed";
      base.metrics = "2 trips • 5 rooms reset";
      break;
    }
    case "Assessment": {
      base.assignee = "Estimator";
      base.attendees = ["Estimator"];
      base.statusSummary = "Completed";
      base.metrics = "Full contents walkthrough completed";
      break;
    }
    case "Final Walkthrough": {
      base.assignee = "Project manager";
      base.attendees = ["Project manager", "Customer"];
      base.statusSummary = "Completed – signed off";
      base.metrics = "All punch items closed";
      break;
    }
    default: {
      base.assignee = "Field lead";
      base.attendees = ["Field lead"];
      base.statusSummary = "Scheduled";
      break;
    }
  }

  return base;
}

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

type SortKey = "order" | "billTo" | "date" | "service" | "amount" | "billingStatus";

type SubmitProgress = { total: number; done: number; amount: number };

type OrderSelectionState = {
  totalLines: number;
  selectedLines: number;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  checked: boolean | "indeterminate";
};

function computeOrderSelectionState(
  ledgerItems: ServiceRow[],
  selectedById: Record<number, boolean>
): OrderSelectionState {
  const totalLines = ledgerItems.length;
  const selectedLines = ledgerItems.reduce(
    (acc, item) => acc + (selectedById[item.id] ? 1 : 0),
    0
  );
  const isAllSelected = totalLines > 0 && selectedLines === totalLines;
  const isIndeterminate = selectedLines > 0 && selectedLines < totalLines;
  const checked: boolean | "indeterminate" = isIndeterminate ? "indeterminate" : isAllSelected;
  return { totalLines, selectedLines, isAllSelected, isIndeterminate, checked };
}

function computeOrderTotals(rows: ServiceRow[]): Record<string, number> {
  const totals: Record<string, number> = {};
  rows.forEach((row) => {
    if (row.excluded) return;
    totals[row.orderNumber] = (totals[row.orderNumber] ?? 0) + row.amount;
  });
  return totals;
}

function computeOrderLineCounts(rows: ServiceRow[]): Record<string, number> {
  const counts: Record<string, number> = {};
  rows.forEach((row) => {
    if (row.excluded) return;
    counts[row.orderNumber] = (counts[row.orderNumber] ?? 0) + 1;
  });
  return counts;
}

function validateServiceDraft(draft: ServiceDraft): {
  errors: Record<string, string>;
  parsed?: {
    date: string;
    user?: string;
    service: string;
    quantity: number;
    amount: number;
    billingStatus: BillingStatus;
    note?: string;
    excluded: boolean;
  };
} {
  const errors: Record<string, string> = {};
  if (!draft.date) errors.date = "Required";
  if (!draft.service.trim()) errors.service = "Required";
  const qty = Number(draft.quantity);
  if (!Number.isFinite(qty) || qty <= 0) errors.quantity = "Must be > 0";
  const amt = Number(draft.amount);
  if (!Number.isFinite(amt) || amt < 0) errors.amount = "Must be ≥ 0";
  if (Object.keys(errors).length > 0) return { errors };
  const user = draft.user.trim();
  const event = draft.event.trim();
  return {
    errors,
    parsed: {
      date: draft.date,
      user: user ? user : undefined,
      event: event ? event : undefined,
      eventId: draft.eventId,
      service: draft.service.trim(),
      quantity: qty,
      amount: amt,
      billingStatus: draft.billingStatus,
      note: draft.note.trim() ? draft.note.trim() : undefined,
      excluded: !!draft.excluded,
    },
  };
}

function draftFromRow(row: ServiceRow): ServiceDraft {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    orderName: row.orderName,
    billTo: row.billTo,
    date: row.date,
    user: row.user ?? "",
    event: row.event ?? "",
    eventId: row.eventId,
    service: row.service,
    quantity: String(row.quantity),
    amount: String(row.amount),
    billingStatus: row.billingStatus,
    note: row.note ?? "",
    excluded: !!row.excluded,
  };
}

function newDraftForOrder(template: ServiceRow): ServiceDraft {
  return {
    orderNumber: template.orderNumber,
    orderName: template.orderName,
    billTo: template.billTo,
    date: template.date,
    user: "",
    event: "",
    service: "",
    quantity: "1",
    amount: "0",
    billingStatus: "Unbilled",
    note: "",
    excluded: false,
  };
}

// Orders that have a completed event but no service lines entered (mock – in real app from calendar/API).
const ORDERS_WITH_COMPLETED_EVENT_NO_SERVICES: Array<{
  orderNumber: string;
  orderName: string;
  billTo: string;
  date: string;
}> = [
  { orderNumber: "1250999", orderName: "Demo-NoServicesNJ", billTo: "Demo Restoration", date: "2025-11-20" },
];

function useDraggable(isOpen: boolean) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) setPosition(null);
  }, [isOpen]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const el = (e.currentTarget as HTMLElement).closest("[data-draggable-modal]") as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition((prev) => prev ?? { x: rect.left, y: rect.top });
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top,
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { startX, startY, startLeft, startTop } = dragRef.current;
      setPosition({
        x: startLeft + e.clientX - startX,
        y: startTop + e.clientY - startY,
      });
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isOpen]);

  const modalStyle: React.CSSProperties =
    position != null
      ? { position: "fixed", left: position.x, top: position.y, zIndex: 50 }
      : {};

  const dragHandleProps = {
    onMouseDown,
    className: "cursor-grab active:cursor-grabbing select-none",
  };

  return { modalStyle, dragHandleProps };
}

export default function ServicesApp() {
  const { query: searchTerm } = useGlobalSearch();
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [lineApprovedFlags, setLineApprovedFlags] = useState<Record<number, boolean>>({});
  const [services, setServices] = useState<ServiceRow[]>(INITIAL_SERVICES);
  const nextIdRef = useRef<number>(Math.max(...INITIAL_SERVICES.map((s) => s.id)) + 1);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<ServiceDraft | null>(null);
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const activeRowRef = useRef<HTMLDivElement | null>(null);
  const [leavingOrders, setLeavingOrders] = useState<string[]>([]);
  const [leavingLineIds, setLeavingLineIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<SubmitProgress | null>(null);
  const [eventDetails, setEventDetails] = useState<CalendarEventDetails | null>(null);
  const [eventServiceUser, setEventServiceUser] = useState<string | null>(null);

  const editDrag = useDraggable(editOpen);
  const eventDetailsDrag = useDraggable(!!eventDetails);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filtered = useMemo(() => {
    return services.filter((row) => {
      if (!normalizedSearch) return true;
      const haystack = [
        row.orderName,
        row.orderNumber,
        row.billTo,
        row.user,
        row.event,
        row.service,
        row.billingStatus,
        row.note,
        row.excluded ? "excluded" : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [services, normalizedSearch]);

  const orderRows = useMemo(() => {
    const orderMap = new Map<string, ServiceRow>();
    filtered.forEach((row) => {
      if (!orderMap.has(row.orderNumber)) orderMap.set(row.orderNumber, row);
    });
    return Array.from(orderMap.values());
  }, [filtered]);

  const orderTotals = useMemo(() => computeOrderTotals(services), [services]);
  const orderLineCounts = useMemo(() => computeOrderLineCounts(services), [services]);

  const sorted = useMemo(() => {
    return [...orderRows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "order") {
        cmp = a.orderName.localeCompare(b.orderName) || a.orderNumber.localeCompare(b.orderNumber);
      } else if (sortKey === "billTo") {
        cmp = a.billTo.localeCompare(b.billTo);
      } else if (sortKey === "service") {
        cmp = a.service.localeCompare(b.service);
      } else if (sortKey === "billingStatus") {
        cmp = a.billingStatus.localeCompare(b.billingStatus);
      } else if (sortKey === "amount") {
        const aTotal = orderTotals[a.orderNumber] ?? 0;
        const bTotal = orderTotals[b.orderNumber] ?? 0;
        cmp = aTotal - bTotal;
      } else {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [orderRows, sortKey, sortDirection, orderTotals]);

  const sortedWithPlaceholders = useMemo(() => {
    const existingNumbers = new Set(sorted.map((r) => r.orderNumber));
    const placeholders = ORDERS_WITH_COMPLETED_EVENT_NO_SERVICES.filter(
      (p) => !existingNumbers.has(p.orderNumber)
    ).map((p, i) => ({
      id: -1000 - i,
      orderNumber: p.orderNumber,
      orderName: p.orderName,
      billTo: p.billTo,
      date: p.date,
      service: "",
      quantity: 0,
      amount: 0,
      billingStatus: "Unbilled" as const,
    }));
    return [...sorted, ...placeholders];
  }, [sorted]);

  const visibleRows = useMemo(() => {
    return expandedOrder
      ? sortedWithPlaceholders.filter((row) => row.orderNumber === expandedOrder)
      : sortedWithPlaceholders;
  }, [sortedWithPlaceholders, expandedOrder]);

  const orderNumbers = useMemo(() => {
    return Array.from(new Set(services.map((s) => s.orderNumber)));
  }, [services]);

  const ordersSelectedCount = useMemo(() => {
    return orderNumbers.filter((orderNumber) => {
      const items = services.filter((s) => s.orderNumber === orderNumber && !s.excluded);
      return items.some((item) => !!lineApprovedFlags[item.id]);
    }).length;
  }, [orderNumbers, services, lineApprovedFlags]);

  const ordersFullySelectedCount = useMemo(() => {
    return orderNumbers.filter((orderNumber) => {
      const items = services.filter((s) => s.orderNumber === orderNumber && !s.excluded);
      return items.length > 0 && items.every((item) => !!lineApprovedFlags[item.id]);
    }).length;
  }, [orderNumbers, services, lineApprovedFlags]);

  const ordersPartiallySelectedCount = useMemo(() => {
    return orderNumbers.filter((orderNumber) => {
      const items = services.filter((s) => s.orderNumber === orderNumber && !s.excluded);
      const selected = items.filter((item) => !!lineApprovedFlags[item.id]).length;
      return selected > 0 && selected < items.length;
    }).length;
  }, [orderNumbers, services, lineApprovedFlags]);

  const total = services.length;
  const leavingSet = useMemo(() => new Set(leavingOrders), [leavingOrders]);
  const leavingLines = useMemo(() => new Set(leavingLineIds), [leavingLineIds]);

  const canSubmit = useMemo(() => {
    return services.some((s) => !!lineApprovedFlags[s.id] && !s.excluded) && !isSubmitting;
  }, [services, lineApprovedFlags, isSubmitting]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const getSortHeaderClass = (key: SortKey, extra?: string) => {
    const base = extra ? `${extra} ` : "";
    const active = sortKey === key ? "text-slate-900" : "";
    return `${base}cursor-pointer select-none hover:text-slate-700 ${active}`.trim();
  };

  const handleRowClick = (row: ServiceRow) => {
    setExpandedOrder((prev) => (prev === row.orderNumber ? null : row.orderNumber));
  };

  const openAddLine = (orderNumber: string, fallbackRow?: ServiceRow) => {
    const template = services.find((s) => s.orderNumber === orderNumber) ?? fallbackRow ?? null;
    if (!template) return;
    setDraftErrors({});
    setDraft(newDraftForOrder(template));
    setEditOpen(true);
  };

  const openEditLine = (row: ServiceRow) => {
    setDraftErrors({});
    setDraft(draftFromRow(row));
    setEditOpen(true);
  };

  const closeEditor = () => {
    setEditOpen(false);
    setDraft(null);
    setDraftErrors({});
  };

  const toggleExcluded = (row: ServiceRow) => {
    setServices((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, excluded: !r.excluded } : r))
    );
    setLineApprovedFlags((prev) => {
      const updated = { ...prev };
      delete updated[row.id];
      return updated;
    });
  };

  const saveDraft = () => {
    if (!draft) return;
    const result = validateServiceDraft(draft);
    if (Object.keys(result.errors).length > 0 || !result.parsed) {
      setDraftErrors(result.errors);
      return;
    }
    const { parsed } = result;
    if (draft.id != null) {
      setServices((prev) =>
        prev.map((r) =>
          r.id === draft.id
            ? {
                ...r,
                date: parsed.date,
                user: parsed.user,
                event: parsed.event,
                eventId: parsed.eventId,
                service: parsed.service,
                quantity: parsed.quantity,
                amount: parsed.amount,
                note: parsed.note,
                excluded: parsed.excluded,
              }
            : r
        )
      );
      if (parsed.excluded) {
        setLineApprovedFlags((prev) => {
          const updated = { ...prev };
          delete updated[draft.id as number];
          return updated;
        });
      }
    } else {
      const newId = nextIdRef.current++;
      const newRow: ServiceRow = {
        id: newId,
        orderNumber: draft.orderNumber,
        orderName: draft.orderName,
        billTo: draft.billTo,
        date: parsed.date,
        user: parsed.user,
        event: parsed.event,
        eventId: parsed.eventId,
        service: parsed.service,
        quantity: parsed.quantity,
        amount: parsed.amount,
        billingStatus: parsed.billingStatus,
        note: parsed.note,
        excluded: parsed.excluded,
      };
      setServices((prev) => [...prev, newRow]);
    }
    closeEditor();
  };

  const handleSubmitToInvoice = () => {
    if (!canSubmit) return;
    const rowsToSubmit = services.filter((s) => !!lineApprovedFlags[s.id] && !s.excluded);
    if (rowsToSubmit.length === 0) return;
    const amount = rowsToSubmit.reduce((acc, r) => acc + r.amount, 0);
    const byOrder = new Map<string, ServiceRow[]>();
    rowsToSubmit.forEach((row) => {
      const existing = byOrder.get(row.orderNumber) ?? [];
      existing.push(row);
      byOrder.set(row.orderNumber, existing);
    });
    const fullyClearedOrders = Array.from(byOrder.keys()).filter((orderNumber) => {
      const billableItems = services.filter((s) => s.orderNumber === orderNumber && !s.excluded);
      const selectedCount = byOrder.get(orderNumber)?.length ?? 0;
      return billableItems.length > 0 && selectedCount === billableItems.length;
    });
    const orderedRows = [...rowsToSubmit].sort((a, b) => {
      const cmp = a.orderNumber.localeCompare(b.orderNumber);
      if (cmp !== 0) return cmp;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    setSubmitProgress({ total: orderedRows.length, done: 0, amount });
    setIsSubmitting(true);
    const base = 140;
    const stagger = 95;
    const fadeDuration = 460;
    const orderFadeLead = 200;
    const lastIndexByOrder = new Map<string, number>();
    orderedRows.forEach((row, idx) => lastIndexByOrder.set(row.orderNumber, idx));
    fullyClearedOrders.forEach((orderNumber) => {
      const lastIdx = lastIndexByOrder.get(orderNumber) ?? 0;
      const startDelay = base + lastIdx * stagger;
      window.setTimeout(() => {
        setLeavingOrders((prev) => (prev.includes(orderNumber) ? prev : [...prev, orderNumber]));
      }, Math.max(0, startDelay - orderFadeLead));
    });
    orderedRows.forEach((row, idx) => {
      const startDelay = base + idx * stagger;
      window.setTimeout(() => {
        setLeavingLineIds((prev) => (prev.includes(row.id) ? prev : [...prev, row.id]));
      }, startDelay);
      window.setTimeout(() => {
        setServices((prev) => prev.filter((r) => r.id !== row.id));
        setLineApprovedFlags((prev) => {
          const updated = { ...prev };
          delete updated[row.id];
          return updated;
        });
        setLeavingLineIds((prev) => prev.filter((id) => id !== row.id));
        setSubmitProgress((prev) =>
          prev ? { ...prev, done: Math.min(prev.done + 1, prev.total) } : prev
        );
      }, startDelay + fadeDuration);
    });
    const totalDelay = base + orderedRows.length * stagger + fadeDuration + 140;
    window.setTimeout(() => {
      setLeavingOrders([]);
      setIsSubmitting(false);
    }, totalDelay);
    window.setTimeout(() => setSubmitProgress(null), totalDelay + 1400);
  };

  useEffect(() => {
    if (expandedOrder && activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [expandedOrder]);

  useEffect(() => {
    if (!expandedOrder) return;
    const stillExists = services.some((s) => s.orderNumber === expandedOrder);
    if (!stillExists) setExpandedOrder(null);
  }, [services, expandedOrder]);

  return (
    <AppPageLayout icon={Wrench} title="Services">
      <Card className="border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" className="gap-1 bg-sky-700 text-white hover:bg-sky-800">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-slate-300 text-slate-700 hover:bg-slate-50"
              onClick={() => {}}
            >
              <SlidersHorizontal className="h-3 w-3" />
              Filter
            </Button>
            <Button
              size="sm"
              className="gap-1 bg-sky-700 text-white hover:bg-sky-800 disabled:pointer-events-none disabled:opacity-60 text-xs"
              onClick={handleSubmitToInvoice}
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {isSubmitting ? "Submitting..." : "Submit selected"}
            </Button>
          </div>
        </div>
        <CardContent className="px-0 pb-3">
            {submitProgress && (
              <div className="mx-4 mt-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-slate-700 transition-all">
                <div className="flex items-center gap-2">
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-sky-700" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-sky-700" />
                  )}
                  <div className="flex-1">
                    {isSubmitting
                      ? `Submitting ${submitProgress.done}/${submitProgress.total} line items (${formatCurrency(submitProgress.amount)})…`
                      : `Submitted ${submitProgress.total} line items (${formatCurrency(submitProgress.amount)}) to invoice.`}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sky-100">
                      <div
                        className="h-full bg-sky-700 transition-[width] duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (submitProgress.total === 0
                                ? 0
                                : (submitProgress.done / submitProgress.total) * 100) * 10
                            ) / 10
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-2 text-[11px] text-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  <span className="font-semibold text-slate-900">{orderNumbers.length}</span> orders
                </span>
                <span>
                  • <span className="font-semibold text-sky-700">{ordersSelectedCount}</span> with
                  selected lines
                </span>
                <span>
                  • <span className="font-semibold text-amber-700">{ordersPartiallySelectedCount}</span> partial
                </span>
                <span>
                  • <span className="font-semibold text-slate-700">{ordersFullySelectedCount}</span> fully selected
                </span>
                <span className="text-slate-400">|</span>
                <span>
                  <span className="font-semibold text-slate-900">{total}</span> service rows
                </span>
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,2.0fr)_minmax(0,1.8fr)_minmax(0,1.0fr)_minmax(0,1.7fr)_minmax(0,0.7fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,0.8fr)] items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <div className={getSortHeaderClass("order")} onClick={() => handleSort("order")}>
                Order
              </div>
              <div className={getSortHeaderClass("billTo")} onClick={() => handleSort("billTo")}>
                Bill to
              </div>
              <div className={getSortHeaderClass("date")} onClick={() => handleSort("date")}>
                Date
              </div>
              <div className={getSortHeaderClass("service")} onClick={() => handleSort("service")}>
                Service
              </div>
              <div className="text-right">Lines</div>
              <div className={getSortHeaderClass("amount", "text-right")} onClick={() => handleSort("amount")}>
                Amount
              </div>
              <div
                className={getSortHeaderClass("billingStatus")}
                onClick={() => handleSort("billingStatus")}
              >
                Billing status
              </div>
              <div className="text-center">Approve</div>
            </div>

            {visibleRows.map((row, index) => {
              const isExpanded = expandedOrder === row.orderNumber;
              const ledgerItems = services.filter((item) => item.orderNumber === row.orderNumber);
              const billableLedgerItems = ledgerItems.filter((item) => !item.excluded);
              const excludedCount = ledgerItems.length - billableLedgerItems.length;
              const orderSel = computeOrderSelectionState(billableLedgerItems, lineApprovedFlags);
              const isLeavingOrder = leavingSet.has(row.orderNumber);
              const lineCount = orderLineCounts[row.orderNumber] ?? 0;
              const isCompletedEventNoServices =
                lineCount === 0 &&
                ORDERS_WITH_COMPLETED_EVENT_NO_SERVICES.some((p) => p.orderNumber === row.orderNumber);

              return (
                <React.Fragment key={row.orderNumber}>
                  <div
                    ref={index === 0 ? activeRowRef : undefined}
                    className={`relative overflow-hidden grid transition-all duration-500 ease-out grid-cols-[minmax(0,2.0fr)_minmax(0,1.8fr)_minmax(0,1.0fr)_minmax(0,1.7fr)_minmax(0,0.7fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,0.8fr)] items-center gap-2 border-b px-4 py-2 text-xs cursor-pointer ${
                      orderSel.isAllSelected ? "bg-sky-50 hover:bg-sky-100" : "bg-white hover:bg-slate-50"
                    } ${isExpanded ? "bg-sky-50 hover:bg-sky-50 border-sky-200" : "border-slate-100"} ${
                      isLeavingOrder ? "opacity-0 translate-x-8 scale-[0.985] pointer-events-none" : ""
                    }`}
                    onClick={() => !isLeavingOrder && handleRowClick(row)}
                  >
                    {isLeavingOrder && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-sky-500/15 to-transparent animate-pulse"
                      />
                    )}
                    <div className="break-words whitespace-normal font-medium text-slate-900">
                      {row.orderName} ({row.orderNumber})
                    </div>
                    <div className="break-words whitespace-normal text-slate-700">{row.billTo}</div>
                    <div className="text-[11px] text-slate-600">{formatShortDate(row.date)}</div>
                    <div className="break-words whitespace-normal text-slate-700">{row.service}</div>
                    <div
                      className="text-right text-[11px] text-slate-700"
                      title={isCompletedEventNoServices ? "Completed event with no services entered" : undefined}
                    >
                      {isCompletedEventNoServices ? (
                        <span className="font-semibold text-red-600">0</span>
                      ) : (
                        lineCount
                      )}
                    </div>
                    <div className="text-right text-[11px] font-medium text-slate-800">
                      {formatCurrency(orderTotals[row.orderNumber] ?? 0)}
                    </div>
                    <div className="text-[11px] font-medium text-slate-800">{row.billingStatus}</div>
                    <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={orderSel.checked}
                        disabled={isLeavingOrder || isSubmitting || billableLedgerItems.length === 0}
                        className="border-sky-700 data-[state=checked]:bg-sky-700 data-[state=checked]:border-sky-700 data-[state=indeterminate]:bg-sky-700 data-[state=indeterminate]:border-sky-700 data-[state=checked]:text-white data-[state=indeterminate]:text-white focus-visible:ring-sky-500/40"
                        onCheckedChange={(checked) => {
                          const next = checked === true;
                          setLineApprovedFlags((prev) => {
                            const updated = { ...prev };
                            billableLedgerItems.forEach((item) => {
                              updated[item.id] = next;
                            });
                            return updated;
                          });
                        }}
                        aria-label={`Approve all billable service lines for order ${row.orderNumber}`}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-b border-sky-200 bg-sky-50/60 px-4 pb-3 pt-2 text-[11px] text-slate-800">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="font-semibold uppercase tracking-wide text-[10px] text-slate-600">
                            Service ledger
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {row.orderName} ({row.orderNumber})
                            {excludedCount > 0 ? ` • ${excludedCount} excluded` : ""}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-[11px] border-sky-700/70 text-sky-700 hover:bg-sky-50"
                          onClick={() => openAddLine(row.orderNumber, row)}
                          disabled={isSubmitting || isLeavingOrder}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add line
                        </Button>
                      </div>
                      <div className="overflow-hidden rounded-md border border-sky-200">
                        <div className="grid grid-cols-[minmax(0,1.0fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,1.9fr)_minmax(0,1.8fr)_minmax(0,0.7fr)_minmax(0,1.0fr)_minmax(0,0.95fr)] bg-sky-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-900">
                          <div>Date</div>
                          <div>Event</div>
                          <div>User</div>
                          <div>Service</div>
                          <div>Note</div>
                          <div className="text-right">Qty</div>
                          <div className="text-right">Amount</div>
                          <div className="text-center">Approve</div>
                        </div>
                        {ledgerItems.map((item, idx) => {
                          const isLeavingLine = leavingLines.has(item.id);
                          const isExcluded = !!item.excluded;
                          const isBillable = !isExcluded;
                          const eventInfo = getEventDetails(item.eventId, item.event, item.orderNumber, item.orderName, item.date);
                          return (
                            <div
                              key={item.id}
                              className={`grid grid-cols-[minmax(0,1.0fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,1.9fr)_minmax(0,1.8fr)_minmax(0,0.7fr)_minmax(0,1.0fr)_minmax(0,0.95fr)] px-3 py-1 transition-all duration-500 ease-out ${
                                idx % 2 === 0 ? "bg-sky-100" : "bg-sky-50"
                              } ${isLeavingLine ? "opacity-0 translate-x-6" : ""} ${isExcluded ? "opacity-60" : ""}`}
                            >
                              <div className={isExcluded ? "line-through" : ""}>
                                {formatShortDate(item.date)}
                              </div>
                              <div className={isExcluded ? "line-through" : ""}>
                                {eventInfo ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEventDetails(eventInfo);
                                      setEventServiceUser(
                                        eventInfo.assignee || eventInfo.attendees[0] || null
                                      );
                                    }}
                                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-left text-sky-700 underline decoration-sky-400 underline-offset-1 hover:bg-sky-200/60"
                                  >
                                    <CalendarDays className="h-3 w-3 shrink-0" />
                                    {item.event || "—"}
                                  </button>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </div>
                              <div className={`flex items-center justify-center ${isExcluded ? "line-through opacity-60" : ""}`}>
                                {item.user ? (
                                  <UserAvatar name={item.user} size="sm" />
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </div>
                              <div className={`break-words whitespace-normal ${isExcluded ? "line-through" : ""}`}>
                                {item.service}
                              </div>
                              <div className={`break-words whitespace-normal text-slate-800 ${isExcluded ? "line-through" : ""}`}>
                                {item.note || "—"}
                              </div>
                              <div className={`text-right ${isExcluded ? "line-through" : ""}`}>{item.quantity}</div>
                              <div className={`text-right font-medium ${isExcluded ? "line-through" : ""}`}>
                                {formatCurrency(item.amount)}
                              </div>
                              <div
                                className="flex items-center justify-center gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-sky-200 bg-white text-sky-700 shadow-sm transition hover:bg-sky-50 disabled:opacity-50"
                                  onClick={() => openEditLine(item)}
                                  disabled={isSubmitting || isLeavingOrder || isLeavingLine}
                                  aria-label={`Edit service line ${item.orderNumber}-${item.id}`}
                                  type="button"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border shadow-sm transition disabled:opacity-50 ${
                                    isExcluded
                                      ? "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
                                      : "border-sky-200 bg-white text-sky-700 hover:bg-sky-50"
                                  }`}
                                  onClick={() => toggleExcluded(item)}
                                  disabled={isSubmitting || isLeavingOrder || isLeavingLine}
                                  aria-label={
                                    isExcluded
                                      ? `Include service line ${item.orderNumber}-${item.id} on invoice`
                                      : `Exclude service line ${item.orderNumber}-${item.id} from invoice`
                                  }
                                  type="button"
                                  title={isExcluded ? "Included (click to unexclude)" : "Exclude from invoice"}
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </button>
                                <Checkbox
                                  checked={!!lineApprovedFlags[item.id]}
                                  disabled={isLeavingOrder || isSubmitting || isLeavingLine || !isBillable}
                                  className="border-sky-700 data-[state=checked]:bg-sky-700 data-[state=checked]:border-sky-700 data-[state=indeterminate]:bg-sky-700 data-[state=indeterminate]:border-sky-700 data-[state=checked]:text-white data-[state=indeterminate]:text-white focus-visible:ring-sky-500/40"
                                  onCheckedChange={(checked) =>
                                    setLineApprovedFlags((prev) => ({ ...prev, [item.id]: !!checked }))
                                  }
                                  aria-label={`Approve service line ${item.orderNumber}-${item.id}`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {visibleRows.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                No services match the current filters.
              </div>
            )}
          </CardContent>
        </Card>

      {editOpen && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div
            data-draggable-modal
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            style={editDrag.modalStyle}
          >
            <div
              {...editDrag.dragHandleProps}
              className="flex items-start justify-between border-b px-4 py-3"
            >
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {draft.id != null ? "Edit service line" : "Add service line"}
                </div>
                <div className="text-xs text-slate-500">
                  {draft.orderName} ({draft.orderNumber}) • {draft.billTo}
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Date</label>
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(e) => setDraft((prev) => (prev ? { ...prev, date: e.target.value } : prev))}
                    className={`h-9 w-full rounded-lg border px-2 text-xs outline-none focus:ring-2 focus:ring-sky-200 ${
                      draftErrors.date ? "border-red-300" : "border-slate-200"
                    }`}
                  />
                  {draftErrors.date && (
                    <div className="text-[11px] text-red-600">{draftErrors.date}</div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">User</label>
                  <Input
                    value={draft.user}
                    onChange={(e) => setDraft((prev) => (prev ? { ...prev, user: e.target.value } : prev))}
                    className="h-9 text-xs"
                    placeholder="e.g., John Smith"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Event type</label>
                  <select
                    value={draft.event}
                    onChange={(e) => setDraft((prev) => (prev ? { ...prev, event: e.target.value } : prev))}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    {EVENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt || "none"} value={opt}>
                        {opt || "— None —"}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500">Associate this charge with a calendar event</span>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700">Exclude from invoice</label>
                  <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-2">
                    <Checkbox
                      checked={draft.excluded}
                      className="border-sky-700 data-[state=checked]:bg-sky-700 data-[state=checked]:border-sky-700 data-[state=checked]:text-white focus-visible:ring-sky-500/40"
                      onCheckedChange={(checked) =>
                        setDraft((prev) => (prev ? { ...prev, excluded: !!checked } : prev))
                      }
                      aria-label="Exclude this line from invoice"
                    />
                    <span className="text-xs text-slate-600">
                      {draft.excluded ? "Excluded" : "Included"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700">Service</label>
                  <Input
                    value={draft.service}
                    onChange={(e) => setDraft((prev) => (prev ? { ...prev, service: e.target.value } : prev))}
                    className={draftErrors.service ? "border-red-300" : ""}
                    placeholder="e.g., Contents cleaning"
                    list="service-types"
                  />
                  <datalist id="service-types">
                    {SERVICE_TYPE_SUGGESTIONS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  {draftErrors.service && (
                    <div className="text-[11px] text-red-600">{draftErrors.service}</div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Quantity</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={draft.quantity}
                    onChange={(e) =>
                      setDraft((prev) => (prev ? { ...prev, quantity: e.target.value } : prev))
                    }
                    className={`h-9 w-full rounded-lg border px-2 text-xs outline-none focus:ring-2 focus:ring-sky-200 ${
                      draftErrors.quantity ? "border-red-300" : "border-slate-200"
                    }`}
                  />
                  {draftErrors.quantity && (
                    <div className="text-[11px] text-red-600">{draftErrors.quantity}</div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Amount</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={draft.amount}
                    onChange={(e) =>
                      setDraft((prev) => (prev ? { ...prev, amount: e.target.value } : prev))
                    }
                    className={`h-9 w-full rounded-lg border px-2 text-xs outline-none focus:ring-2 focus:ring-sky-200 ${
                      draftErrors.amount ? "border-red-300" : "border-slate-200"
                    }`}
                  />
                  {draftErrors.amount && (
                    <div className="text-[11px] text-red-600">{draftErrors.amount}</div>
                  )}
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700">Note</label>
                  <textarea
                    value={draft.note}
                    onChange={(e) => setDraft((prev) => (prev ? { ...prev, note: e.target.value } : prev))}
                    className="min-h-[84px] w-full resize-none rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-sky-200"
                    placeholder="Optional note for billing / ops..."
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              <Button variant="outline" size="sm" onClick={closeEditor}>
                Cancel
              </Button>
              <Button size="sm" className="bg-sky-700 text-white hover:bg-sky-800" onClick={saveDraft}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar event details popover */}
      {eventDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div
            data-draggable-modal
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl"
            style={eventDetailsDrag.modalStyle}
          >
            <div
              {...eventDetailsDrag.dragHandleProps}
              className="flex items-center justify-between border-b border-slate-200 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-sky-600" />
                <span className="text-sm font-semibold text-slate-900">Calendar event details</span>
              </div>
              <button
                type="button"
                onClick={() => setEventDetails(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-1">
                <span className="text-slate-500">Type</span>
                <span className="font-medium text-slate-900">{eventDetails.type}</span>
                <span className="text-slate-500">Date</span>
                <span className="font-medium text-slate-900">
                  {formatShortDate(eventDetails.date)} • {eventDetails.time}
                </span>
                <span className="text-slate-500">Order</span>
                <span className="font-medium text-slate-900">
                  {eventDetails.orderName} ({eventDetails.orderNumber})
                </span>
                <span className="text-slate-500">Status</span>
                <span className="font-medium text-slate-900">
                  {eventDetails.statusSummary}
                  {eventDetails.metrics ? (
                    <span className="block text-xs font-normal text-slate-600">
                      {eventDetails.metrics}
                    </span>
                  ) : null}
                </span>
                {eventDetails.address && (
                  <>
                    <span className="text-slate-500">Address</span>
                    <span className="text-slate-700">{eventDetails.address}</span>
                  </>
                )}
                {eventDetails.notes && (
                  <>
                    <span className="text-slate-500">Notes</span>
                    <span className="text-slate-700">{eventDetails.notes}</span>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Assignee & attendees
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {eventDetails.assignee && (
                    <UserAvatar name={eventDetails.assignee} size="sm" />
                  )}
                  {eventDetails.attendees.map((name) => (
                    <UserAvatar key={name} name={name} size="sm" />
                  ))}
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Add services for this event
                  </div>
                </div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">Service user</span>
                    <select
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-sky-200"
                      value={
                        eventServiceUser ??
                        eventDetails.assignee ??
                        eventDetails.attendees[0] ??
                        ""
                      }
                      onChange={(e) => setEventServiceUser(e.target.value || null)}
                    >
                      {eventDetails.assignee && (
                        <option value={eventDetails.assignee}>{eventDetails.assignee}</option>
                      )}
                      {eventDetails.attendees.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-1 h-8 px-3 text-xs sm:mt-0"
                    onClick={() => {
                      const userName =
                        eventServiceUser ??
                        eventDetails.assignee ??
                        eventDetails.attendees[0] ??
                        "";
                      const template = services.find(
                        (s) => s.orderNumber === eventDetails.orderNumber
                      );
                      if (!template) {
                        setEventDetails(null);
                        return;
                      }
                      const baseDraft = newDraftForOrder(template);
                      baseDraft.user = userName;
                      baseDraft.event = eventDetails.type;
                      baseDraft.eventId = eventDetails.id !== "—" ? eventDetails.id : undefined;
                      baseDraft.date = eventDetails.date;
                      setDraftErrors({});
                      setDraft(baseDraft);
                      setEditOpen(true);
                      setEventDetails(null);
                    }}
                  >
                    Add service line
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-200 px-4 py-3">
              <Button variant="outline" size="sm" onClick={() => setEventDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppPageLayout>
  );
}
