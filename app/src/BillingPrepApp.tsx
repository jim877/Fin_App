import { useState } from "react";
import { Check, ClipboardCheck, Plus, SlidersHorizontal } from "lucide-react";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { useGlobalSearch } from "@/contexts/GlobalSearchContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export type BillingPrepRow = {
  id: number;
  orderNumber: string;
  orderName: string;
  billTo: string;
  rep: string;
  coaDate?: string | null;
  dopDate?: string | null;
  deliveryStatus: string;
  billDueDate?: string | null;
  claimNumber?: string | null;
  dateOfLoss?: string | null;
  billToConfirmed?: boolean;
  paymentMethod?: string | null;
};

export type BillingPrepNote = {
  id: number;
  text: string;
  createdAt: string;
  createdBy: string;
};

const BILLING_PREP_ROWS: BillingPrepRow[] = [
  {
    id: 1,
    orderNumber: "1250037",
    orderName: "Cotton-HackettstownNJ",
    billTo: "Gemini Restoration Inc.",
    rep: "DF",
    coaDate: "2025-10-15",
    dopDate: "2025-11-05",
    deliveryStatus: "Delivered / Ready to bill",
    billDueDate: "2025-11-20",
    claimNumber: "CLM-2025-001",
    dateOfLoss: "2025-09-18",
    billToConfirmed: true,
    paymentMethod: "Carrier check",
  },
  {
    id: 2,
    orderNumber: "1250679",
    orderName: "Winterroth-YonkersNY",
    billTo: "Cleaning Co - German Arana",
    rep: "JC",
    coaDate: "2025-10-02",
    dopDate: undefined,
    deliveryStatus: "Contents outstanding",
    billDueDate: "2025-11-25",
    claimNumber: "CLM-2025-014",
    dateOfLoss: "2025-09-21",
    billToConfirmed: false,
    paymentMethod: "TBD",
  },
  {
    id: 3,
    orderNumber: "1240703",
    orderName: "Lee-SomersetNJ",
    billTo: "All States Restoration",
    rep: "RH",
    coaDate: undefined,
    dopDate: "2025-11-03",
    deliveryStatus: "Final delivery scheduled",
    billDueDate: "2025-11-28",
    claimNumber: "CLM-2024-887",
    dateOfLoss: "2024-12-02",
    billToConfirmed: true,
    paymentMethod: "Portal",
  },
  {
    id: 4,
    orderNumber: "1250220",
    orderName: "Parry-NewYorkNY",
    billTo: "Cleaning Co - Lamar Townes",
    rep: "JC",
    coaDate: "2025-09-20",
    dopDate: "2025-10-30",
    deliveryStatus: "Field notes missing",
    billDueDate: "2025-11-18",
    claimNumber: "CLM-2025-033",
    dateOfLoss: "2025-10-05",
    billToConfirmed: false,
    paymentMethod: "ACH",
  },
  {
    id: 5,
    orderNumber: "1250818",
    orderName: "Schor-ChalfontPA",
    billTo: "Mark 1 Restoration / ATI",
    rep: "RH",
    coaDate: "2025-11-10",
    dopDate: "2025-11-16",
    deliveryStatus: "Ready for invoice review",
    billDueDate: "2025-11-27",
    claimNumber: "CLM-2025-045",
    dateOfLoss: "2025-10-22",
    billToConfirmed: true,
    paymentMethod: "Carrier check",
  },
];

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

function getBillDueMeta(billDueDate?: string | null) {
  if (!billDueDate) {
    return { label: "—", className: "text-slate-400", title: "No due date" };
  }

  const date = new Date(billDueDate);
  if (Number.isNaN(date.getTime())) {
    return { label: billDueDate, className: "text-slate-600", title: "Due date" };
  }

  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const dueUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((dueUtc - todayUtc) / (1000 * 60 * 60 * 24));

  const label = formatShortDate(billDueDate);
  let className = "text-slate-900";
  let statusLabel = "Due later";

  if (diffDays < 0) {
    className = "text-red-600 font-semibold";
    statusLabel = "Past due";
  } else if (diffDays <= 7) {
    className = "text-amber-600 font-semibold";
    statusLabel = "Due soon";
  }

  return { label, className, title: `${statusLabel} (${label})` };
}

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

function hasCoa(row: BillingPrepRow) {
  return !!row.coaDate;
}

function hasDop(row: BillingPrepRow) {
  return !!row.dopDate;
}

type SortKey = "order" | "billTo" | "rep" | "billDueDate" | "coa" | "dop";

function getSortValue(row: BillingPrepRow, key: SortKey) {
  if (key === "order") return `${row.orderName} ${row.orderNumber}`.toLowerCase();
  if (key === "billTo") return row.billTo.toLowerCase();
  if (key === "rep") return row.rep.toLowerCase();
  if (key === "billDueDate") return row.billDueDate || "";
  if (key === "coa") return row.coaDate || "";
  if (key === "dop") return row.dopDate || "";
  return "";
}

export default function BillingPrepApp() {
  const { query: searchTerm } = useGlobalSearch();
  const [sortKey, setSortKey] = useState<SortKey>("billDueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Record<number, boolean>>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [repFilter, setRepFilter] = useState<string[]>([]);
  const [detailRow, setDetailRow] = useState<BillingPrepRow | null>(null);
  const [autoNotifyRep, setAutoNotifyRep] = useState(true);
  const [autoRemindMissingDocs, setAutoRemindMissingDocs] = useState(true);
  const [autoLockWhenReady, setAutoLockWhenReady] = useState(false);
  const [notesByRow, setNotesByRow] = useState<Record<number, BillingPrepNote[]>>({
    1: [
      {
        id: 1,
        text: "COA verified. Waiting on carrier confirmation for bill-to.",
        createdAt: "2025-11-15T10:15:00Z",
        createdBy: "DF",
      },
    ],
    2: [
      {
        id: 2,
        text: "Contents still outstanding. Field team to update by Friday.",
        createdAt: "2025-11-16T09:00:00Z",
        createdBy: "JC",
      },
    ],
  });
  const [noteSearch, setNoteSearch] = useState("");
  const [noteDraft, setNoteDraft] = useState("");

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredRows = BILLING_PREP_ROWS.filter((row) => {
    if (normalizedSearch) {
      const haystack = [
        row.orderName,
        row.orderNumber,
        row.billTo,
        row.rep,
        row.deliveryStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(normalizedSearch)) return false;
    }

    if (repFilter.length > 0 && !repFilter.includes(row.rep)) {
      return false;
    }

    return true;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    const aVal = getSortValue(a, sortKey);
    const bVal = getSortValue(b, sortKey);
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

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
    return `${base}cursor-pointer select-none ${active}`.trim();
  };

  const handleToggleRow = (id: number) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectedCount = sortedRows.filter((row) => selectedIds[row.id]).length;

  const handleSelectAll = () => {
    if (selectedCount === sortedRows.length) {
      setSelectedIds({});
    } else {
      const next: Record<number, boolean> = {};
      sortedRows.forEach((row) => {
        next[row.id] = true;
      });
      setSelectedIds(next);
    }
  };

  const uniqueReps = Array.from(new Set(BILLING_PREP_ROWS.map((r) => r.rep))).sort();

  return (
    <AppPageLayout icon={ClipboardCheck} title="Billing Prep">
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
              onClick={() => setIsFilterOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </Button>
            <Button size="sm" className="gap-1 bg-sky-700 text-white hover:bg-sky-800 text-xs">
              Request prep on selected
            </Button>
          </div>
        </div>
        <CardContent className="px-0 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-2 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  <span className="font-semibold text-slate-900">{filteredRows.length}</span> open
                  orders
                </span>
                <span className="text-slate-400">|</span>
                <span>
                  <span className="font-semibold text-slate-900">{selectedCount}</span> selected
                </span>
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,2.3fr)_minmax(0,1.7fr)_auto_minmax(0,1.4fr)_minmax(0,1.6fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.6fr)] items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div
                className={getSortHeaderClass("order")}
                onClick={() => handleSort("order")}
              >
                Order
              </div>
              <div
                className={getSortHeaderClass("billTo")}
                onClick={() => handleSort("billTo")}
              >
                Bill to
              </div>
              <div
                className={getSortHeaderClass("rep", "text-center")}
                onClick={() => handleSort("rep")}
              >
                Rep
              </div>
              <div
                className={getSortHeaderClass("billDueDate")}
                onClick={() => handleSort("billDueDate")}
              >
                Bill due
              </div>
              <div>Delivery status</div>
              <div
                className={getSortHeaderClass("coa", "text-center")}
                onClick={() => handleSort("coa")}
                title="COA = Certificate of Approval"
              >
                COA
              </div>
              <div
                className={getSortHeaderClass("dop", "text-center")}
                onClick={() => handleSort("dop")}
                title="DOP = Date of Pack-out"
              >
                DOP
              </div>
              <div className="text-center">
                <button
                  type="button"
                  className="text-xs font-semibold text-sky-700 underline underline-offset-2"
                  onClick={handleSelectAll}
                >
                  All
                </button>
              </div>
            </div>

            {sortedRows.map((row) => {
              const isSelected = !!selectedIds[row.id];
              const dueMeta = getBillDueMeta(row.billDueDate);

              return (
                <div
                  key={row.id}
                  className={`grid grid-cols-[minmax(0,2.3fr)_minmax(0,1.7fr)_auto_minmax(0,1.4fr)_minmax(0,1.6fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.6fr)] items-center gap-2 border-b border-slate-100 px-4 py-2 text-xs transition cursor-pointer ${
                    isSelected ? "bg-sky-50" : "bg-white hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    setDetailRow(row);
                    setNoteSearch("");
                  }}
                >
                  <div className="break-words whitespace-normal font-medium text-slate-900">
                    {row.orderName} ({row.orderNumber})
                  </div>
                  <div className="break-words whitespace-normal text-slate-700">{row.billTo}</div>
                  <div className="flex items-center justify-center">
                    {row.rep ? (
                      <div className={getRepBadgeClasses(row.rep)}>{row.rep}</div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                  <div
                    className={`text-xs ${dueMeta.className}`}
                    title={dueMeta.title}
                  >
                    {dueMeta.label}
                  </div>
                  <div className="break-words whitespace-normal text-xs text-slate-700">
                    {row.deliveryStatus}
                  </div>
                  <div className="flex items-center justify-center">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        hasCoa(row)
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-slate-300 bg-slate-50 text-slate-300"
                      }`}
                      title={
                        row.coaDate
                          ? `COA on ${formatShortDate(row.coaDate)}`
                          : "COA not on file"
                      }
                    >
                      {hasCoa(row) && <Check className="h-2.5 w-2.5" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        hasDop(row)
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-slate-300 bg-slate-50 text-slate-300"
                      }`}
                      title={
                        row.dopDate
                          ? `DOP on ${formatShortDate(row.dopDate)}`
                          : "DOP not on file"
                      }
                    >
                      {hasDop(row) && <Check className="h-2.5 w-2.5" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleRow(row.id)}
                      className="border-slate-300 data-[state=checked]:bg-sky-700 data-[state=checked]:border-sky-700 data-[state=checked]:text-white"
                    />
                  </div>
                </div>
              );
            })}

            {sortedRows.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                All orders in view are fully prepped.
              </div>
            )}
          </CardContent>
        </Card>

      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Filter</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3 text-xs">
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
                    onClick={() => {
                      setRepFilter((prev) =>
                        prev.includes(rep) ? prev.filter((r) => r !== rep) : [...prev, rep]
                      );
                    }}
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
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setRepFilter([]);
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
        open={!!detailRow}
        onOpenChange={(open) => {
          if (!open) {
            setDetailRow(null);
            setNoteDraft("");
            setNoteSearch("");
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Billing prep details</DialogTitle>
          </DialogHeader>
          {detailRow && (
            <DialogBody className="flex flex-col">
              <div className="space-y-6">
                {/* Order & rep / bill to */}
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Order
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {detailRow.orderName} ({detailRow.orderNumber})
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Sales rep
                      </div>
                      <div className="mt-0.5">
                        <div className={getRepBadgeClasses(detailRow.rep)}>{detailRow.rep}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Bill to
                      </div>
                      <div className="mt-0.5 text-sm text-slate-900 break-words">
                        {detailRow.billTo}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Claim, dates, payment – paired rows to avoid huge gaps */}
                <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Claim number
                    </div>
                    <div className="text-sm font-medium text-slate-900">
                      {detailRow.claimNumber || "—"}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Date of loss
                    </div>
                    <div className="text-sm font-medium text-slate-900">
                      {detailRow.dateOfLoss ? formatShortDate(detailRow.dateOfLoss) : "—"}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Bill to confirmed
                    </div>
                    <div className="text-sm font-medium text-slate-900">
                      {detailRow.billToConfirmed ? "Yes" : "No"}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Payment method
                    </div>
                    <div className="text-sm font-medium text-slate-900">
                      {detailRow.paymentMethod || "—"}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      DOP
                    </div>
                    <div className="text-sm font-medium text-slate-900">
                      {detailRow.dopDate ? formatShortDate(detailRow.dopDate) : "—"}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Bill due
                    </div>
                    {(() => {
                      const meta = getBillDueMeta(detailRow.billDueDate);
                      return (
                        <div className={`text-sm font-medium ${meta.className}`} title={meta.title}>
                          {meta.label}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Prep checklist */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
                    Prep checklist
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          hasCoa(detailRow)
                            ? "border-emerald-700 bg-emerald-700 text-white"
                            : "border-slate-300 bg-slate-50 text-slate-300"
                        }`}
                        title={
                          detailRow.coaDate
                            ? `COA on ${formatShortDate(detailRow.coaDate)}`
                            : "COA not on file"
                        }
                      >
                        {hasCoa(detailRow) && <Check className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-800">COA on file</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {detailRow.coaDate ? formatShortDate(detailRow.coaDate) : "Missing"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          hasDop(detailRow)
                            ? "border-emerald-700 bg-emerald-700 text-white"
                            : "border-slate-300 bg-slate-50 text-slate-300"
                        }`}
                        title={
                          detailRow.dopDate
                            ? `DOP on ${formatShortDate(detailRow.dopDate)}`
                            : "DOP not on file"
                        }
                      >
                        {hasDop(detailRow) && <Check className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-800">DOP on file</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {detailRow.dopDate ? formatShortDate(detailRow.dopDate) : "Missing"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                      Delivery status
                    </div>
                    <div className="text-sm text-slate-800">{detailRow.deliveryStatus}</div>
                  </div>
                </div>

                {/* Automation settings */}
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
                    Automation settings
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        checked={autoNotifyRep}
                        onChange={(e) => setAutoNotifyRep(e.target.checked)}
                      />
                      <span className="text-sm text-slate-700 leading-snug">
                        Notify rep when this order becomes ready to bill
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        checked={autoRemindMissingDocs}
                        onChange={(e) => setAutoRemindMissingDocs(e.target.checked)}
                      />
                      <span className="text-sm text-slate-700 leading-snug">
                        Remind field team weekly if COA or DOP is missing
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        checked={autoLockWhenReady}
                        onChange={(e) => setAutoLockWhenReady(e.target.checked)}
                      />
                      <span className="text-sm text-slate-700 leading-snug">
                        Lock order from changes once marked ready to bill
                      </span>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                  {(() => {
                    const notesForRow = notesByRow[detailRow.id] ?? [];
                    const normalizedNoteSearch = noteSearch.trim().toLowerCase();
                    const visibleNotes =
                      normalizedNoteSearch.length === 0
                        ? notesForRow
                        : notesForRow.filter((note) =>
                            note.text.toLowerCase().includes(normalizedNoteSearch)
                          );

                    return (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Notes
                          </div>
                          {notesForRow.length > 0 && (
                            <div className="text-xs text-slate-500">
                              {visibleNotes.length}/{notesForRow.length} visible
                            </div>
                          )}
                        </div>
                        <div className="mb-3">
                          <Input
                            className="h-9 text-sm"
                            placeholder="Search notes..."
                            value={noteSearch}
                            onChange={(e) => setNoteSearch(e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <textarea
                            rows={4}
                            className="min-h-[100px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-0"
                            placeholder="Add an internal note about billing prep..."
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                          />
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              size="sm"
                              className="h-9 px-4 text-sm"
                              disabled={!noteDraft.trim()}
                              onClick={() => {
                                if (!noteDraft.trim()) return;
                                const now = new Date();
                                const newNote: BillingPrepNote = {
                                  id: now.getTime(),
                                  text: noteDraft.trim(),
                                  createdAt: now.toISOString(),
                                  createdBy: "Finance",
                                };
                                setNotesByRow((prev) => {
                                  const existing = prev[detailRow.id] ?? [];
                                  return {
                                    ...prev,
                                    [detailRow.id]: [newNote, ...existing],
                                  };
                                });
                                setNoteDraft("");
                              }}
                            >
                              Add note
                            </Button>
                          </div>
                        </div>
                        <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 mt-2">
                          {visibleNotes.length === 0 ? (
                            <div className="text-sm text-slate-500 py-2">
                              {notesForRow.length === 0
                                ? "No notes yet for this order."
                                : "No notes match your search."}
                            </div>
                          ) : (
                            visibleNotes.map((note) => (
                              <div
                                key={note.id}
                                className="rounded-lg bg-white px-3 py-2.5 shadow-sm"
                              >
                                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                  <span>{note.createdBy}</span>
                                  <span>
                                    {(() => {
                                      const d = new Date(note.createdAt);
                                      if (Number.isNaN(d.getTime())) return note.createdAt;
                                      return d.toLocaleString();
                                    })()}
                                  </span>
                                </div>
                                <div className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed">
                                  {note.text}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </DialogBody>
          )}
        </DialogContent>
      </Dialog>
    </AppPageLayout>
  );
}
