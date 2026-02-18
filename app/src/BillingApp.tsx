import { useState } from "react";
import {
  CreditCard,
  Plus,
  SlidersHorizontal,
  HelpCircle,
  FileText,
  ChevronRight,
} from "lucide-react";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { useGlobalSearch } from "@/contexts/GlobalSearchContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

type BillingOrder = {
  id: number;
  orderNumber: string;
  orderName: string;
  billTo: string;
  services: string;
  rep: string;
  deliveryStatus: string;
  billingStatus: string;
  hasCOA: boolean;
  hasDOP: boolean;
  hasCOS: boolean;
  billDueDate: string;
  claimNumber: string;
  dateOfLoss: string;
  billToConfirmed: boolean;
  paymentMethod: string;
  dopDate: string | null;
};

type BillingNote = {
  id: number;
  orderId: number;
  author: string;
  text: string;
  createdAt: string;
};

const BILLING_ORDERS: BillingOrder[] = [
  {
    id: 1,
    orderNumber: "1240703",
    orderName: "Lee-SomersetNJ",
    billTo: "Safeco",
    services: "Packout, contents cleaning, storage",
    rep: "RH",
    deliveryStatus: "Final delivery complete",
    billingStatus: "Ready to bill",
    hasCOA: true,
    hasDOP: true,
    hasCOS: true,
    billDueDate: "2025-11-30",
    claimNumber: "SF-987654",
    dateOfLoss: "2025-10-12",
    billToConfirmed: true,
    paymentMethod: "Check",
    dopDate: "2025-11-05",
  },
  {
    id: 2,
    orderNumber: "1250679",
    orderName: "Winterroth-YonkersNY",
    billTo: "Travelers",
    services: "Packout, storage",
    rep: "JC",
    deliveryStatus: "Contents returned",
    billingStatus: "Waiting on COS",
    hasCOA: true,
    hasDOP: false,
    hasCOS: false,
    billDueDate: "2025-11-25",
    claimNumber: "TR-552210",
    dateOfLoss: "2025-09-28",
    billToConfirmed: true,
    paymentMethod: "EFT",
    dopDate: null,
  },
  {
    id: 3,
    orderNumber: "1250037",
    orderName: "Cotton-HackettstownNJ",
    billTo: "National General Insurance",
    services: "Contents cleaning, long-term storage",
    rep: "DF",
    deliveryStatus: "Storage active",
    billingStatus: "Pre-bill review",
    hasCOA: false,
    hasDOP: false,
    hasCOS: false,
    billDueDate: "2025-12-05",
    claimNumber: "NG-773311",
    dateOfLoss: "2025-08-19",
    billToConfirmed: false,
    paymentMethod: "Check",
    dopDate: null,
  },
  {
    id: 4,
    orderNumber: "1250220",
    orderName: "Parry-NewYorkNY",
    billTo: "Allstate",
    services: "Packout, cleaning, unpack",
    rep: "JC",
    deliveryStatus: "Unpack complete",
    billingStatus: "Ready to bill",
    hasCOA: true,
    hasDOP: true,
    hasCOS: true,
    billDueDate: "2025-11-22",
    claimNumber: "AS-449920",
    dateOfLoss: "2025-09-03",
    billToConfirmed: true,
    paymentMethod: "Portal",
    dopDate: "2025-11-15",
  },
  {
    id: 5,
    orderNumber: "1250818",
    orderName: "Schor-ChalfontPA",
    billTo: "USAA",
    services: "Packout, storage, emergency textile",
    rep: "RH",
    deliveryStatus: "Final walk-through scheduled",
    billingStatus: "Waiting on COA",
    hasCOA: false,
    hasDOP: true,
    hasCOS: true,
    billDueDate: "2025-12-10",
    claimNumber: "US-120045",
    dateOfLoss: "2025-09-30",
    billToConfirmed: false,
    paymentMethod: "Credit card",
    dopDate: "2025-11-18",
  },
];

const INITIAL_BILLING_NOTES: BillingNote[] = [
  { id: 1, orderId: 4, author: "DF", text: "Confirmed bill-to portal and COA uploaded.", createdAt: "2025-11-15T09:15:00Z" },
  { id: 2, orderId: 1, author: "RH", text: "Waiting on program form from carrier.", createdAt: "2025-11-16T14:30:00Z" },
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

function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  if (Number.isNaN(due.getTime())) return 0;
  due.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function getBillDueMeta(dateStr: string) {
  const days = daysUntil(dateStr);
  let color = "bg-slate-900";
  if (days < 0) color = "bg-red-500";
  else if (days <= 7) color = "bg-orange-400";

  const label =
    days < 0
      ? `${Math.abs(days)}d late`
      : days === 0
        ? "Due today"
        : days === 1
          ? "1 day"
          : `${days} days`;

  return { days, color, label };
}

type SortKey = "order" | "billTo" | "rep" | "status" | "billDue";

export default function BillingApp() {
  const { query: searchTerm } = useGlobalSearch();
  const [sortKey, setSortKey] = useState<SortKey>("billDue");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedOrder, setSelectedOrder] = useState<BillingOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [repFilter, setRepFilter] = useState<string[]>([]);
  const [cosOrder, setCOSOrder] = useState<BillingOrder | null>(null);
  const [isCOSOpen, setIsCOSOpen] = useState(false);
  const [notes, setNotes] = useState<BillingNote[]>(INITIAL_BILLING_NOTES);
  const [noteSearch, setNoteSearch] = useState("");
  const [newNote, setNewNote] = useState("");

  const computedOrders = BILLING_ORDERS.map((order) => {
    const meta = getBillDueMeta(order.billDueDate);
    return { ...order, daysRemaining: meta.days };
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const uniqueReps = Array.from(new Set(BILLING_ORDERS.map((o) => o.rep))).filter(Boolean);

  const filteredOrders = computedOrders.filter((order) => {
    if (repFilter.length > 0 && !repFilter.includes(order.rep)) return false;
    if (!normalizedSearch) return true;
    const haystack = [
      order.orderName,
      order.orderNumber,
      order.billTo,
      order.deliveryStatus,
      order.services,
      order.billingStatus,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "order") {
      cmp = a.orderName.localeCompare(b.orderName) || a.orderNumber.localeCompare(b.orderNumber);
    } else if (sortKey === "billTo") {
      cmp = a.billTo.localeCompare(b.billTo);
    } else if (sortKey === "rep") {
      cmp = a.rep.localeCompare(b.rep);
    } else if (sortKey === "status") {
      cmp = a.billingStatus.localeCompare(b.billingStatus);
    } else if (sortKey === "billDue") {
      cmp = a.daysRemaining - b.daysRemaining;
    }
    return sortDirection === "asc" ? cmp : -cmp;
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
    return `${base}cursor-pointer select-none hover:text-slate-700 ${active}`.trim();
  };

  const handleRowClick = (order: BillingOrder & { daysRemaining: number }) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const toggleRepFilter = (rep: string) => {
    setRepFilter((prev) =>
      prev.includes(rep) ? prev.filter((r) => r !== rep) : [...prev, rep]
    );
  };

  const normalizedNoteSearch = noteSearch.trim().toLowerCase();
  const currentOrderNotes =
    selectedOrder == null
      ? []
      : notes.filter((note) => {
          if (note.orderId !== selectedOrder.id) return false;
          if (!normalizedNoteSearch) return true;
          const text = note.text.toLowerCase();
          const author = note.author.toLowerCase();
          return text.includes(normalizedNoteSearch) || author.includes(normalizedNoteSearch);
        });

  return (
    <AppPageLayout icon={CreditCard} title="Billing">
      <Card className="border-slate-200 bg-white">
        <CardContent className="px-0 pb-3">
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
                <SlidersHorizontal className="h-3 w-3" />
                Filter
              </Button>
              <Button size="sm" className="gap-1 bg-sky-700 text-white hover:bg-sky-800">
                Create invoice batch
              </Button>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Services check shows if services are entered. COS opens the linked COS document.</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-2 pt-2 text-xs text-slate-600">
            <span>
              <span className="font-semibold text-slate-900">{sortedOrders.length}</span> orders ready to bill
            </span>
          </div>

          <div className="grid grid-cols-[40px_minmax(0,2.1fr)_minmax(0,1.6fr)_72px_minmax(0,1.6fr)_96px_40px_40px_56px] items-center gap-1 border-b border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div className="flex items-center justify-center" aria-hidden="true">
                <ChevronRight className="h-3 w-3 text-slate-400" />
              </div>
              <div className={getSortHeaderClass("order")} onClick={() => handleSort("order")}>
                Order
              </div>
              <div className={getSortHeaderClass("billTo")} onClick={() => handleSort("billTo")}>
                Bill to
              </div>
              <div
                className={getSortHeaderClass(
                  "rep",
                  "flex items-center justify-center text-center justify-self-center"
                )}
                onClick={() => handleSort("rep")}
              >
                Rep
              </div>
              <div className={getSortHeaderClass("status")} onClick={() => handleSort("status")}>
                Status
              </div>
              <div className={getSortHeaderClass("billDue")} onClick={() => handleSort("billDue")}>
                Bill due
              </div>
              <div className="flex items-center justify-center text-center justify-self-center">
                Services
              </div>
              <div className="flex items-center justify-center text-center justify-self-center">
                COS
              </div>
              <div className="flex items-center justify-center text-center justify-self-center">
                Select
              </div>
            </div>

            {sortedOrders.map((order) => {
              const dueMeta = getBillDueMeta(order.billDueDate);
              const hasServices = order.services.trim().length > 0;

              return (
                <div
                  key={order.id}
                  className="grid grid-cols-[40px_minmax(0,2.1fr)_minmax(0,1.6fr)_72px_minmax(0,1.6fr)_96px_40px_40px_56px] items-center gap-1 border-b border-slate-100 px-4 py-2 text-xs cursor-pointer hover:bg-slate-50"
                  onClick={() => handleRowClick(order)}
                >
                  <div className="flex items-center justify-center">
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                  </div>
                  <div className="break-words whitespace-normal font-medium text-slate-900">
                    {order.orderName} ({order.orderNumber})
                  </div>
                  <div className="break-words whitespace-normal text-slate-700">{order.billTo}</div>
                  <div className="flex items-center justify-center">
                    <div className={getRepBadgeClasses(order.rep)}>{order.rep}</div>
                  </div>
                  <div className="text-xs text-slate-700">{order.billingStatus}</div>
                  <div className="flex items-center gap-1 text-xs text-slate-700">
                    <span className={`inline-block h-3 w-3 rounded-full ${dueMeta.color}`} />
                    <span>{dueMeta.label}</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                        hasServices
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 text-slate-300"
                      }`}
                    >
                      ✓
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCOSOrder(order);
                      setIsCOSOpen(true);
                    }}
                  >
                    <button
                      type="button"
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-sky-600 ${
                        order.hasCOS
                          ? "border-sky-300 bg-sky-50"
                          : "border-slate-200 bg-white text-slate-300"
                      }`}
                      aria-label={`Open COS for order ${order.orderNumber}`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div
                    className="flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox aria-label={`Select order ${order.orderNumber}`} />
                  </div>
                </div>
              );
            })}

            {sortedOrders.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                No billing orders match the current filters.
              </div>
            )}
          </CardContent>
        </Card>

      {/* Detail dialog */}
      <Dialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) {
            setSelectedOrder(null);
            setNoteSearch("");
            setNewNote("");
          }
        }}
      >
        <DialogContent className="max-h-[80vh] max-w-3xl flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Billing details
              {selectedOrder
                ? ` – ${selectedOrder.orderName} (${selectedOrder.orderNumber})`
                : ""}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <DialogBody className="space-y-4 text-xs">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600">Bill to</Label>
                    <div className="text-slate-800">{selectedOrder.billTo}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600">Sales rep</Label>
                    <div className="flex items-center gap-2">
                      <div className={getRepBadgeClasses(selectedOrder.rep)}>
                        {selectedOrder.rep}
                      </div>
                      <span className="text-xs text-slate-700">
                        Primary contact for billing questions.
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600">
                      Billing status
                    </Label>
                    <div className="text-slate-800">{selectedOrder.billingStatus}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600">
                      Claim number
                    </Label>
                    <div className="text-slate-800">{selectedOrder.claimNumber || "—"}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600">
                      Date of loss
                    </Label>
                    <div className="text-slate-800">{formatShortDate(selectedOrder.dateOfLoss)}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600">Bill due</Label>
                    <div className="flex items-center gap-1 text-slate-800">
                      {(() => {
                        const meta = getBillDueMeta(selectedOrder.billDueDate);
                        return (
                          <>
                            <span
                              className={`inline-block h-2.5 w-2.5 rounded-full ${meta.color}`}
                            />
                            <span>{meta.label}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600">
                      Bill to confirmed
                    </Label>
                    <div className="text-slate-800">
                      {selectedOrder.billToConfirmed ? "Yes" : "No"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600">
                      Payment method
                    </Label>
                    <div className="text-slate-800">{selectedOrder.paymentMethod || "—"}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600">DOP</Label>
                    <div className="text-slate-800">{formatShortDate(selectedOrder.dopDate)}</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Billing readiness
                  </div>
                  <div className="text-xs text-slate-700">
                    Review COA, DOP, services, and program requirements before adding this order to
                    an invoice batch.
                  </div>
                  <div className="mt-1 space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          selectedOrder.services.trim().length > 0 ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                      <span className="text-slate-700">Services entered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          selectedOrder.hasCOS ? "bg-sky-500" : "bg-slate-300"
                        }`}
                      />
                      <span className="text-slate-700">COS uploaded</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Billing automation
                  </div>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-slate-700">
                    <li>Include in next invoice batch when marked ready.</li>
                    <li>Sync invoice details to accounting system.</li>
                    <li>Remind sales rep if unpaid after 30 days.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Program requirements
                </div>
                <ul className="list-disc space-y-1 pl-4 text-xs text-slate-700">
                  <li>Confirm bill-to contact, portal, or mailing requirements.</li>
                  <li>Attach COA, photos, scope, and any carrier forms as needed.</li>
                  <li>Note deductibles, holdbacks, or carrier-specific guidelines.</li>
                </ul>
              </div>

              <div className="space-y-2 border-t border-slate-200 pt-3">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase text-slate-500">Notes</div>
                  <Label
                    htmlFor="billing-note"
                    className="text-xs font-medium text-slate-600"
                  >
                    Add note
                  </Label>
                  <textarea
                    id="billing-note"
                    className="mt-1 h-16 w-full resize-none rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Add a billing note for this order..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      className="mt-1 h-7 px-3 text-xs"
                      disabled={!newNote.trim() || !selectedOrder}
                      onClick={() => {
                        if (!selectedOrder || !newNote.trim()) return;
                        setNotes((prev) => [
                          {
                            id: prev.length ? Math.max(...prev.map((n) => n.id)) + 1 : 1,
                            orderId: selectedOrder.id,
                            author: selectedOrder.rep,
                            text: newNote.trim(),
                            createdAt: new Date().toISOString(),
                          },
                          ...prev,
                        ]);
                        setNewNote("");
                      }}
                    >
                      Save note
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Previous notes
                  </div>
                  <Input
                    placeholder="Search notes..."
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                    className="h-7 w-40 text-xs"
                  />
                </div>

                <div className="max-h-24 space-y-2 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 px-2 py-2">
                  {currentOrderNotes.length === 0 ? (
                    <div className="text-xs text-slate-500">No notes yet.</div>
                  ) : (
                    currentOrderNotes.map((note) => (
                      <div key={note.id} className="space-y-0.5 text-xs">
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-semibold">{note.author}</span>
                          <span>{formatDateTime(note.createdAt)}</span>
                        </div>
                        <div className="whitespace-pre-wrap text-slate-800">{note.text}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogBody>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* COS dialog */}
      <Dialog
        open={isCOSOpen}
        onOpenChange={(open) => {
          setIsCOSOpen(open);
          if (!open) setCOSOrder(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              COS document
              {cosOrder ? ` – ${cosOrder.orderName} (${cosOrder.orderNumber})` : ""}
            </DialogTitle>
          </DialogHeader>

          {cosOrder && (
            <DialogBody className="space-y-3 text-xs">
              <p className="text-slate-700">
                Preview or attach the Certificate of Satisfaction (COS) associated with this order.
              </p>
              <p className="text-xs text-slate-600">
                In a live system this would open the stored COS PDF or provide a way to upload it.
              </p>
            </DialogBody>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCOSOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Billing filters</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4 text-xs">
            <div>
              <Label className="text-xs uppercase tracking-wide text-slate-500">
                Sales reps
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {uniqueReps.map((rep) => {
                  const active = repFilter.includes(rep);
                  return (
                    <button
                      key={rep}
                      type="button"
                      className={`flex items-center gap-2 rounded-full border px-2 py-1 text-xs transition ${
                        active
                          ? "border-sky-600 bg-sky-50 text-sky-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                      }`}
                      onClick={() => toggleRepFilter(rep)}
                    >
                      <div className={getRepBadgeClasses(rep)}>{rep}</div>
                      <span>{rep}</span>
                    </button>
                  );
                })}
                {uniqueReps.length === 0 && (
                  <span className="text-xs text-slate-500">No reps on this list yet.</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <button
                type="button"
                className="text-sky-700 hover:underline"
                onClick={() => setRepFilter([])}
              >
                Clear filters
              </button>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFilterOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppPageLayout>
  );
}
