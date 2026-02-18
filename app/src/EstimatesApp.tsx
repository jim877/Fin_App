import { useState } from "react";
import { Bell, ChevronDown, ChevronRight, ClipboardList, Plus, SlidersHorizontal } from "lucide-react";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { useGlobalSearch } from "@/contexts/GlobalSearchContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EstimateType = "Ballpark" | "Tag & Hold" | "Not to Exceed";

type EstimateRow = {
  id: number;
  orderName: string;
  orderNumber: string;
  referrer: string;
  type: EstimateType;
  rep: string;
  billTo: string;
  billDate: string;
  estimateValue: number;
  followUpDate?: string | null;
  followUpNotes?: string;
  followUpDone?: boolean;
  approved: boolean;
  approvalDate?: string | null;
  autoRequested?: boolean;
  followUpMethod?: "Text" | "Email" | "Portal" | "Call";
};

type EstimateNote = {
  id: number;
  estimateId: number;
  text: string;
  createdAt: string;
  createdBy: string;
};

const INITIAL_ESTIMATES: EstimateRow[] = [
  {
    id: 1,
    orderName: "Lee-SomersetNJ",
    orderNumber: "1240703",
    referrer: "All States Restoration",
    type: "Not to Exceed",
    rep: "RH",
    billTo: "Safeco",
    billDate: "2025-10-28",
    estimateValue: 12875.25,
    followUpDate: null,
    approved: false,
    followUpMethod: "Email",
  },
  {
    id: 2,
    orderName: "Winterroth-YonkersNY",
    orderNumber: "1250679",
    referrer: "Cleaning Co - German Arana",
    type: "Tag & Hold",
    rep: "JC",
    billTo: "Travelers",
    billDate: "2025-11-03",
    estimateValue: 32650.5,
    followUpDate: "2025-11-09",
    approved: false,
    followUpMethod: "Text",
  },
  {
    id: 3,
    orderName: "Cotton-HackettstownNJ",
    orderNumber: "1250037",
    referrer: "Gemini Restoration Inc.",
    type: "Ballpark",
    rep: "DF",
    billTo: "National General Insurance",
    billDate: "2025-11-04",
    estimateValue: 18500,
    followUpDate: "2025-11-11",
    approved: false,
    followUpMethod: "Email",
  },
  {
    id: 4,
    orderName: "Parry-NewYorkNY",
    orderNumber: "1250220",
    referrer: "Cleaning Co - Lamar Townes",
    type: "Ballpark",
    rep: "JC",
    billTo: "Allstate",
    billDate: "2025-11-07",
    estimateValue: 9420,
    followUpDate: "2025-11-14",
    approved: true,
    approvalDate: "2025-11-15",
    followUpMethod: "Portal",
  },
  {
    id: 5,
    orderName: "Schor-ChalfontPA",
    orderNumber: "1250818",
    referrer: "Mark 1 Restoration / ATI",
    type: "Tag & Hold",
    rep: "RH",
    billTo: "USAA",
    billDate: "2025-11-10",
    estimateValue: 21340.75,
    followUpDate: "2025-11-19",
    approved: true,
    approvalDate: "2025-11-20",
    followUpMethod: "Email",
  },
];

const REP_COLOR_CLASS_MAP: Record<string, string> = {
  JC: "bg-sky-100 text-sky-700 border border-sky-200",
  DF: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  RH: "bg-amber-100 text-amber-700 border border-amber-200",
  MA: "bg-violet-100 text-violet-700 border border-violet-200",
};

function getRepBadgeClasses(rep: string) {
  const base =
    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ";
  const color =
    REP_COLOR_CLASS_MAP[rep] ?? "bg-slate-100 text-slate-700 border border-slate-200";
  return base + color;
}

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function formatShortDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type SortKey =
  | "order"
  | "referrer"
  | "type"
  | "rep"
  | "billToDate"
  | "estimate"
  | "followUp"
  | "approvedDate";

function getSortValue(row: EstimateRow, key: SortKey) {
  switch (key) {
    case "order":
      return `${row.orderName} ${row.orderNumber}`.toLowerCase();
    case "referrer":
      return row.referrer.toLowerCase();
    case "type":
      return row.type.toLowerCase();
    case "rep":
      return row.rep.toLowerCase();
    case "billToDate":
      return `${row.billTo} ${row.billDate}`.toLowerCase();
    case "estimate":
      return row.estimateValue;
    case "followUp":
      return row.followUpDate || "";
    case "approvedDate":
      return row.approvalDate || "";
    default:
      return "";
  }
}

export default function EstimatesApp() {
  const [estimates, setEstimates] = useState<EstimateRow[]>(INITIAL_ESTIMATES);
  const { query: searchTerm } = useGlobalSearch();
  const [repFilter, setRepFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<EstimateType[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pendingSortKey, setPendingSortKey] = useState<SortKey>("followUp");
  const [pendingSortDirection, setPendingSortDirection] = useState<"asc" | "desc">("asc");
  const [approvedSortKey, setApprovedSortKey] = useState<SortKey>("approvedDate");
  const [approvedSortDirection, setApprovedSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedPendingIds, setSelectedPendingIds] = useState<Record<number, boolean>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [detailEstimate, setDetailEstimate] = useState<EstimateRow | null>(null);
  const [notes, setNotes] = useState<EstimateNote[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSearch, setNoteSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all");
  const [pendingSectionOpen, setPendingSectionOpen] = useState(true);
  const [approvedSectionOpen, setApprovedSectionOpen] = useState(true);
  const [reminderEditRow, setReminderEditRow] = useState<EstimateRow | null>(null);
  const [reminderDraft, setReminderDraft] = useState<{
    dueDate: string;
    notes: string;
    done: boolean;
    followUpMethod: string;
  } | null>(null);

  const openReminderForRow = (row: EstimateRow) => {
    setReminderEditRow(row);
    setReminderDraft({
      dueDate: row.followUpDate || "",
      notes: row.followUpNotes || "",
      done: row.followUpDone ?? false,
      followUpMethod: row.followUpMethod || "Email",
    });
  };

  const saveReminderForRow = () => {
    if (!reminderEditRow || !reminderDraft) return;
    setEstimates((prev) =>
      prev.map((r) =>
        r.id === reminderEditRow.id
          ? {
              ...r,
              followUpDate: reminderDraft.dueDate || null,
              followUpNotes: reminderDraft.notes || undefined,
              followUpDone: reminderDraft.done,
              followUpMethod: reminderDraft.followUpMethod as EstimateRow["followUpMethod"],
            }
          : r
      )
    );
    setReminderEditRow(null);
    setReminderDraft(null);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filtered = estimates.filter((row) => {
    if (normalizedSearch) {
      const haystack = [row.orderName, row.orderNumber, row.referrer, row.billTo]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(normalizedSearch)) return false;
    }
    if (repFilter.length > 0 && !repFilter.includes(row.rep)) return false;
    if (typeFilter.length > 0 && !typeFilter.includes(row.type)) return false;
    return true;
  });

  const pending = filtered.filter((row) => !row.approved);
  const approved = filtered.filter((row) => row.approved);

  const showPending = statusFilter === "all" || statusFilter === "pending";
  const showApproved = statusFilter === "all" || statusFilter === "approved";

  const sortedPending = [...pending].sort((a, b) => {
    const aVal = getSortValue(a, pendingSortKey);
    const bVal = getSortValue(b, pendingSortKey);
    if (aVal < bVal) return pendingSortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return pendingSortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const sortedApproved = [...approved].sort((a, b) => {
    const aVal = getSortValue(a, approvedSortKey);
    const bVal = getSortValue(b, approvedSortKey);
    if (aVal < bVal) return approvedSortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return approvedSortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalCount = estimates.length;
  const approvedCount = estimates.filter((e) => e.approved).length;
  const pendingCount = totalCount - approvedCount;

  const uniqueReps = Array.from(new Set(estimates.map((e) => e.rep))).sort();
  const uniqueTypes = Array.from(new Set(estimates.map((e) => e.type))).sort();

  const handleSort = (section: "pending" | "approved", key: SortKey) => {
    if (section === "pending") {
      if (pendingSortKey === key) {
        setPendingSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setPendingSortKey(key);
        setPendingSortDirection("asc");
      }
    } else {
      if (approvedSortKey === key) {
        setApprovedSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setApprovedSortKey(key);
        setApprovedSortDirection("asc");
      }
    }
  };

  const getSortHeaderClass = (
    section: "pending" | "approved",
    key: SortKey,
    extra?: string
  ) => {
    const base = extra ? extra + " " : "";
    const active =
      section === "pending" ? pendingSortKey === key : approvedSortKey === key;
    const activeClass = active ? "text-slate-900" : "";
    return `${base}cursor-pointer select-none ${activeClass}`.trim();
  };

  const handleTogglePending = (id: number) => {
    setSelectedPendingIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const pendingSelectedCount = pending.filter((row) => selectedPendingIds[row.id]).length;

  const handleSelectAllPending = () => {
    if (pendingSelectedCount === pending.length) {
      setSelectedPendingIds({});
    } else {
      const next: Record<number, boolean> = {};
      pending.forEach((row) => {
        next[row.id] = true;
      });
      setSelectedPendingIds(next);
    }
  };

  const handleRequestApproval = () => {
    const ids = new Set(
      pending.filter((row) => selectedPendingIds[row.id]).map((row) => row.id)
    );
    if (ids.size === 0) return;
    setEstimates((prev) =>
      prev.map((row) => (ids.has(row.id) ? { ...row, autoRequested: true } : row))
    );
    setBanner(
      `Sent automatic approval request for ${ids.size} estimate${ids.size === 1 ? "" : "s"}.`
    );
    setTimeout(() => setBanner(null), 4000);
  };

  const openDetail = (row: EstimateRow) => {
    setDetailEstimate(row);
    setNoteDraft("");
    setNoteSearch("");
  };

  const closeDetail = () => {
    setDetailEstimate(null);
    setNoteDraft("");
    setNoteSearch("");
  };

  const notesForDetail = detailEstimate
    ? notes.filter((n) => n.estimateId === detailEstimate.id)
    : [];

  const normalizedNoteSearch = noteSearch.trim().toLowerCase();
  const visibleNotes =
    normalizedNoteSearch.length === 0
      ? notesForDetail
      : notesForDetail.filter((note) =>
          note.text.toLowerCase().includes(normalizedNoteSearch)
        );

  const handleAddNote = () => {
    if (!detailEstimate || !noteDraft.trim()) return;
    const now = new Date();
    const newNote: EstimateNote = {
      id: now.getTime(),
      estimateId: detailEstimate.id,
      text: noteDraft.trim(),
      createdAt: now.toISOString(),
      createdBy: "Finance",
    };
    setNotes((prev) => [newNote, ...prev]);
    setNoteDraft("");
  };

  return (
    <AppPageLayout icon={ClipboardList} title="Estimates">
      <Card className="border-slate-200 bg-white">
        <CardContent className="px-0 pb-4">
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
                onClick={() => setIsFilterOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filter
              </Button>
              <Button
                size="sm"
                className="gap-1 bg-sky-700 text-white hover:bg-sky-800 text-xs"
                onClick={handleRequestApproval}
                disabled={pendingSelectedCount === 0}
              >
                Request approval
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3 pb-2 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  <span className="font-semibold text-slate-900">{totalCount}</span> estimates
                </span>
                <span className="text-emerald-700">
                  • <span className="font-semibold text-emerald-700">{approvedCount}</span> approved
                </span>
                <span className="text-amber-700">
                  • <span className="font-semibold text-amber-700">{pendingCount}</span> pending
                </span>
              </div>
              {banner && (
                <div className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white shadow-sm">
                  {banner}
                </div>
              )}
            </div>

            {/* Quick filters: Pending | Approved */}
            <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
              <span className="text-xs font-medium text-slate-500">Show:</span>
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === "all"
                    ? "border-sky-600 bg-sky-50 text-sky-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === "pending"
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("approved")}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === "approved"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Approved ({approvedCount})
              </button>
            </div>

            {/* Pending section (collapsible) - only when Pending or All is active */}
            {showPending && (
            <div className="border-b border-slate-200">
              <button
                type="button"
                onClick={() => setPendingSectionOpen((o) => !o)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-50"
              >
                {pendingSectionOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
                Pending estimates
                <span className="text-amber-600 font-normal normal-case">
                  ({sortedPending.length})
                </span>
              </button>
            </div>
            )}
            {showPending && pendingSectionOpen && (
            <>

            <div className="grid grid-cols-[minmax(0,2.3fr)_minmax(0,1.7fr)_minmax(0,1.2fr)_auto_minmax(0,1.8fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,0.7fr)] items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div
                className={getSortHeaderClass("pending", "order")}
                onClick={() => handleSort("pending", "order")}
              >
                Order
              </div>
              <div
                className={getSortHeaderClass("pending", "referrer")}
                onClick={() => handleSort("pending", "referrer")}
              >
                Referrer
              </div>
              <div
                className={getSortHeaderClass("pending", "type")}
                onClick={() => handleSort("pending", "type")}
              >
                Type
              </div>
              <div
                className={getSortHeaderClass("pending", "rep", "text-center")}
                onClick={() => handleSort("pending", "rep")}
              >
                Rep
              </div>
              <div
                className={getSortHeaderClass("pending", "billToDate")}
                onClick={() => handleSort("pending", "billToDate")}
              >
                Bill to / Date
              </div>
              <div
                className={getSortHeaderClass("pending", "estimate")}
                onClick={() => handleSort("pending", "estimate")}
              >
                Estimate
              </div>
              <div
                className={`flex items-center gap-1 ${getSortHeaderClass("pending", "followUp")}`}
                onClick={() => handleSort("pending", "followUp")}
              >
                <Bell className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Reminder
              </div>
              <div className="text-center">
                <button
                  type="button"
                  className="text-xs font-semibold text-sky-700 underline underline-offset-2"
                  onClick={handleSelectAllPending}
                >
                  All
                </button>
              </div>
            </div>

            {sortedPending.map((row) => {
              const isSelected = !!selectedPendingIds[row.id];
              return (
                <div
                  key={row.id}
                  className={`grid grid-cols-[minmax(0,2.3fr)_minmax(0,1.7fr)_minmax(0,1.2fr)_auto_minmax(0,1.8fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,0.7fr)] items-center gap-2 border-b border-slate-100 px-4 py-2 text-xs transition cursor-pointer ${
                    isSelected ? "bg-sky-50" : "bg-white hover:bg-slate-50"
                  }`}
                  onClick={() => openDetail(row)}
                >
                  <div className="break-words whitespace-normal font-medium text-slate-900">
                    {row.orderName} ({row.orderNumber})
                  </div>
                  <div className="break-words whitespace-normal text-slate-700">{row.referrer}</div>
                  <div className="text-slate-700">{row.type}</div>
                  <div className="flex items-center justify-center">
                    <div className={getRepBadgeClasses(row.rep)}>{row.rep}</div>
                  </div>
                  <div className="break-words whitespace-normal text-xs text-slate-700">
                    <div>{row.billTo}</div>
                    <div className="text-xs text-slate-500">{formatShortDate(row.billDate)}</div>
                  </div>
                  <div className="text-xs font-semibold text-slate-900">
                    {formatCurrency(row.estimateValue)}
                  </div>
                  <div
                    className="text-xs text-slate-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => openReminderForRow(row)}
                      className={`w-full rounded-lg border px-2 py-1.5 text-left transition hover:bg-sky-50 hover:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-1 ${
                        row.followUpDone
                          ? "border-emerald-200 bg-emerald-50/50 text-slate-500 line-through"
                          : "border-transparent"
                      }`}
                      title="Open reminder"
                    >
                      {row.followUpDate ? (
                        <>
                          <div>{formatShortDate(row.followUpDate)}</div>
                          {row.autoRequested && (
                            <span className="mt-0.5 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              auto
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400">— Set reminder</span>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleTogglePending(row.id)}
                      className="border-slate-300 data-[state=checked]:bg-sky-700 data-[state=checked]:border-sky-700 data-[state=checked]:text-white"
                    />
                  </div>
                </div>
              );
            })}

            {sortedPending.length === 0 && (
              <div className="border-b border-slate-100 px-4 py-6 text-center text-xs text-slate-500">
                No pending estimates in view.
              </div>
            )}
            </>
            )}

            {/* Approved section (collapsible) - only when Approved or All is active */}
            {showApproved && (
            <div className="border-b border-slate-200">
              <button
                type="button"
                onClick={() => setApprovedSectionOpen((o) => !o)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-50"
              >
                {approvedSectionOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
                Recently approved
                <span className="text-emerald-600 font-normal normal-case">
                  ({sortedApproved.length})
                </span>
              </button>
            </div>
            )}
            {showApproved && approvedSectionOpen && (
            <>
            <div className="grid grid-cols-[minmax(0,2.3fr)_minmax(0,1.7fr)_minmax(0,1.2fr)_auto_minmax(0,1.8fr)_minmax(0,1.3fr)_minmax(0,1.3fr)] items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div
                className={getSortHeaderClass("approved", "order")}
                onClick={() => handleSort("approved", "order")}
              >
                Order
              </div>
              <div
                className={getSortHeaderClass("approved", "referrer")}
                onClick={() => handleSort("approved", "referrer")}
              >
                Referrer
              </div>
              <div
                className={getSortHeaderClass("approved", "type")}
                onClick={() => handleSort("approved", "type")}
              >
                Type
              </div>
              <div
                className={getSortHeaderClass("approved", "rep", "text-center")}
                onClick={() => handleSort("approved", "rep")}
              >
                Rep
              </div>
              <div
                className={getSortHeaderClass("approved", "billToDate")}
                onClick={() => handleSort("approved", "billToDate")}
              >
                Bill to / Date
              </div>
              <div
                className={getSortHeaderClass("approved", "estimate")}
                onClick={() => handleSort("approved", "estimate")}
              >
                Estimate
              </div>
              <div
                className={getSortHeaderClass("approved", "approvedDate")}
                onClick={() => handleSort("approved", "approvedDate")}
              >
                Date approved
              </div>
            </div>

            {sortedApproved.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[minmax(0,2.3fr)_minmax(0,1.7fr)_minmax(0,1.2fr)_auto_minmax(0,1.8fr)_minmax(0,1.3fr)_minmax(0,1.3fr)] items-center gap-2 border-b border-slate-100 px-4 py-2 text-xs cursor-pointer bg-white hover:bg-slate-50"
                onClick={() => openDetail(row)}
              >
                <div className="break-words whitespace-normal font-medium text-slate-900">
                  {row.orderName} ({row.orderNumber})
                </div>
                <div className="break-words whitespace-normal text-slate-700">{row.referrer}</div>
                <div className="text-slate-700">{row.type}</div>
                <div className="flex items-center justify-center">
                  <div className={getRepBadgeClasses(row.rep)}>{row.rep}</div>
                </div>
                <div className="break-words whitespace-normal text-xs text-slate-700">
                  <div>{row.billTo}</div>
                  <div className="text-xs text-slate-500">{formatShortDate(row.billDate)}</div>
                </div>
                <div className="text-xs font-semibold text-slate-900">
                  {formatCurrency(row.estimateValue)}
                </div>
                <div className="text-xs text-slate-700">
                  {row.approvalDate ? formatShortDate(row.approvalDate) : "—"}
                </div>
              </div>
            ))}

            {sortedApproved.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                No approved estimates in view yet.
              </div>
            )}
            </>
            )}
          </CardContent>
        </Card>

      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Filter</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sales reps
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`flex items-center gap-2 rounded-full border px-2 py-1 text-xs ${
                    repFilter.length === 0
                      ? "border-sky-600 bg-sky-50 text-sky-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  onClick={() => setRepFilter([])}
                >
                  All reps
                </button>
                {uniqueReps.map((rep) => (
                  <button
                    key={rep}
                    type="button"
                    onClick={() =>
                      setRepFilter((prev) =>
                        prev.includes(rep) ? prev.filter((r) => r !== rep) : [...prev, rep]
                      )
                    }
                    className={`flex items-center gap-2 rounded-full border px-2 py-1 text-xs ${
                      repFilter.includes(rep)
                        ? "border-sky-600 bg-sky-50 text-sky-800"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className={getRepBadgeClasses(rep)}>{rep}</div>
                    <span>{rep}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Type
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`flex items-center gap-2 rounded-full border px-2 py-1 text-xs ${
                    typeFilter.length === 0
                      ? "border-sky-600 bg-sky-50 text-sky-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  onClick={() => setTypeFilter([])}
                >
                  All types
                </button>
                {uniqueTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setTypeFilter((prev) =>
                        prev.includes(type)
                          ? prev.filter((t) => t !== type)
                          : [...prev, type]
                      )
                    }
                    className={`flex items-center gap-2 rounded-full border px-2 py-1 text-xs ${
                      typeFilter.includes(type)
                        ? "border-sky-600 bg-sky-50 text-sky-800"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{type}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setRepFilter([]);
                  setTypeFilter([]);
                  setIsFilterOpen(false);
                }}
              >
                Clear
              </Button>
              <Button type="button" size="sm" onClick={() => setIsFilterOpen(false)}>
                Close
              </Button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!detailEstimate}
        onOpenChange={(open) => {
          if (!open) closeDetail();
        }}
      >
        <DialogContent className="max-w-md flex flex-col">
          <DialogHeader>
            <DialogTitle>Estimate details</DialogTitle>
          </DialogHeader>
          {detailEstimate && (
            <DialogBody className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Order
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {detailEstimate.orderName} ({detailEstimate.orderNumber})
                </div>
              </div>

              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rep
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={getRepBadgeClasses(detailEstimate.rep)}>
                      {detailEstimate.rep}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Referrer
                  </div>
                  <div className="break-words whitespace-normal text-slate-800">
                    {detailEstimate.referrer}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Bill to
                  </div>
                  <div className="text-slate-800">{detailEstimate.billTo}</div>
                  <div className="text-xs text-slate-500">
                    {formatShortDate(detailEstimate.billDate)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </div>
                  <div className="text-slate-800">{detailEstimate.type}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estimate
                  </div>
                  <div className="font-semibold text-slate-900">
                    {formatCurrency(detailEstimate.estimateValue)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reminder
                  </div>
                  <div className="text-slate-800">
                    {detailEstimate.followUpDate
                      ? formatShortDate(detailEstimate.followUpDate)
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Automation settings
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-300 text-sky-700 focus:ring-sky-500"
                      checked={detailEstimate.autoRequested ?? false}
                      readOnly
                    />
                    <span className="text-xs text-slate-700">
                      Automatically send approval request on next reminder date
                    </span>
                  </label>
                  <div className="text-xs text-slate-600">
                    Reminder via: {detailEstimate.followUpMethod || "Email"}
                  </div>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Notes
                  </div>
                  {notesForDetail.length > 0 && (
                    <div className="text-xs text-slate-500">
                      {visibleNotes.length}/{notesForDetail.length} visible
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    className="h-7 text-xs"
                    placeholder="Search notes..."
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Add an internal note about this estimate..."
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 px-3 text-xs"
                      disabled={!noteDraft.trim()}
                      onClick={handleAddNote}
                    >
                      Add note
                    </Button>
                  </div>
                </div>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-slate-100 bg-slate-50 px-2 py-2">
                  {visibleNotes.length === 0 ? (
                    <div className="text-xs text-slate-500">
                      {notesForDetail.length === 0
                        ? "No notes yet for this estimate."
                        : "No notes match your search."}
                    </div>
                  ) : (
                    visibleNotes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-md bg-white px-2 py-1.5 shadow-sm"
                      >
                        <div className="mb-0.5 flex items-center justify-between text-xs text-slate-500">
                          <span>{note.createdBy}</span>
                          <span>
                            {(() => {
                              const d = new Date(note.createdAt);
                              if (Number.isNaN(d.getTime())) return note.createdAt;
                              return d.toLocaleString();
                            })()}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap text-xs text-slate-800">
                          {note.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogBody>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={reminderEditRow !== null && reminderDraft !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReminderEditRow(null);
            setReminderDraft(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reminder</DialogTitle>
          </DialogHeader>
          {reminderEditRow && reminderDraft && (
            <DialogBody className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Order
                </div>
                <div className="font-medium text-slate-900">
                  {reminderEditRow.orderName} ({reminderEditRow.orderNumber})
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Due date</Label>
                <Input
                  type="date"
                  value={reminderDraft.dueDate}
                  onChange={(e) =>
                    setReminderDraft((d) => (d ? { ...d, dueDate: e.target.value } : d))
                  }
                  className="h-9 rounded-lg border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Reminder via</Label>
                <select
                  value={reminderDraft.followUpMethod}
                  onChange={(e) =>
                    setReminderDraft((d) =>
                      d ? { ...d, followUpMethod: e.target.value } : d
                    )
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/50"
                >
                  <option value="Email">Email</option>
                  <option value="Text">Text</option>
                  <option value="Portal">Portal</option>
                  <option value="Call">Call</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Notes</Label>
                <textarea
                  value={reminderDraft.notes}
                  onChange={(e) =>
                    setReminderDraft((d) => (d ? { ...d, notes: e.target.value } : d))
                  }
                  rows={3}
                  placeholder="Optional notes for this reminder"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/50"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={reminderDraft.done}
                  onCheckedChange={(checked) =>
                    setReminderDraft((d) =>
                      d ? { ...d, done: checked === true } : d
                    )
                  }
                  className="border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <span className="text-sm font-medium text-slate-700">Done</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-sky-300 text-sky-700 hover:bg-sky-50"
                  onClick={() => {
                    setReminderEditRow(null);
                    setReminderDraft(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="rounded-xl bg-sky-600 text-white hover:bg-sky-700"
                  onClick={saveReminderForRow}
                >
                  Save
                </Button>
              </div>
            </DialogBody>
          )}
        </DialogContent>
      </Dialog>
    </AppPageLayout>
  );
}
