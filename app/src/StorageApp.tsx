import { useState } from "react";
import { Boxes, Plus, SlidersHorizontal } from "lucide-react";
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

type StorageStatus = "Active" | "Expiring Soon" | "Overdue";

type StorageOrder = {
  id: number;
  orderNumber: string;
  orderName: string;
  company: string;
  storageStart: string;
  storageEnd: string;
  finalDeliveryDate?: string | null;
  estimatedFinalDeliveryDate?: string | null;
  estimatedFinalDeliveryVerifiedAt?: string | null;
  location: string;
  monthlyRate: number;
  storageValue?: number;
};

const STORAGE_ORDERS: StorageOrder[] = [
  {
    id: 1,
    orderNumber: "1250037",
    orderName: "Cotton-HackettstownNJ",
    company: "Gemini Restoration Inc.",
    storageStart: "2025-06-10",
    storageEnd: "2025-12-15",
    finalDeliveryDate: "2025-12-20",
    estimatedFinalDeliveryDate: "2025-12-20",
    estimatedFinalDeliveryVerifiedAt: "2025-10-15",
    location: "Renewal Warehouse - Bay 3",
    monthlyRate: 245,
    storageValue: 48000,
  },
  {
    id: 2,
    orderNumber: "1250679",
    orderName: "Winterroth-YonkersNY",
    company: "Cleaning Co - German Arana",
    storageStart: "2025-07-01",
    storageEnd: "2026-01-05",
    finalDeliveryDate: null,
    estimatedFinalDeliveryDate: "2026-01-10",
    estimatedFinalDeliveryVerifiedAt: "2025-11-01",
    location: "Renewal Warehouse - Bay 1",
    monthlyRate: 310,
    storageValue: 62500,
  },
  {
    id: 3,
    orderNumber: "1240703",
    orderName: "Lee-SomersetNJ",
    company: "All States Restoration",
    storageStart: "2025-04-20",
    storageEnd: "2025-11-25",
    finalDeliveryDate: "2025-11-28",
    estimatedFinalDeliveryDate: "2025-11-28",
    estimatedFinalDeliveryVerifiedAt: "2025-09-30",
    location: "Offsite POD",
    monthlyRate: 195,
    storageValue: 32000,
  },
  {
    id: 4,
    orderNumber: "1250220",
    orderName: "Parry-NewYorkNY",
    company: "Cleaning Co - Lamar Townes",
    storageStart: "2025-05-15",
    storageEnd: "2025-11-30",
    finalDeliveryDate: null,
    estimatedFinalDeliveryDate: "2025-12-05",
    estimatedFinalDeliveryVerifiedAt: "2025-10-20",
    location: "Renewal Warehouse - Bay 4",
    monthlyRate: 275,
    storageValue: 54000,
  },
  {
    id: 5,
    orderNumber: "1250818",
    orderName: "Schor-ChalfontPA",
    company: "Mark 1 Restoration / ATI",
    storageStart: "2025-01-10",
    storageEnd: "2025-10-31",
    finalDeliveryDate: "2025-11-05",
    estimatedFinalDeliveryDate: "2025-11-05",
    estimatedFinalDeliveryVerifiedAt: "2025-09-10",
    location: "Renewal Warehouse - Overflow",
    monthlyRate: 225,
    storageValue: 41000,
  },
];

type StoragePackageSummary = {
  type: string;
  count: number;
};

const STORAGE_PACKAGES: Record<number, StoragePackageSummary[]> = {
  1: [
    { type: "Wardrobe boxes", count: 6 },
    { type: "Dish packs", count: 4 },
    { type: "Large boxes", count: 18 },
  ],
  2: [
    { type: "Palletized contents", count: 3 },
    { type: "Art crates", count: 2 },
  ],
  3: [
    { type: "Totes", count: 20 },
    { type: "Small boxes", count: 15 },
  ],
  4: [
    { type: "Large boxes", count: 12 },
    { type: "Rugs rolled", count: 5 },
  ],
  5: [
    { type: "Palletized contents", count: 2 },
    { type: "Wardrobe boxes", count: 3 },
  ],
};

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

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  if (Number.isNaN(end.getTime())) return 0;
  end.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function getStatusFromDays(daysRemaining: number): StorageStatus {
  if (daysRemaining < 0) return "Overdue";
  if (daysRemaining <= 15) return "Expiring Soon";
  return "Active";
}

function getAgingDotClasses(daysRemaining: number) {
  if (daysRemaining < 0) return "bg-red-500";
  if (daysRemaining <= 15) return "bg-orange-400";
  return "bg-slate-900";
}

type ComputedStorageOrder = StorageOrder & {
  daysRemaining: number;
  status: StorageStatus;
};

type SortKey =
  | "order"
  | "company"
  | "storageEnd"
  | "finalDelivery"
  | "aging"
  | "monthlyRate";

export default function StorageApp() {
  const { query: searchTerm } = useGlobalSearch();
  const [automateFlags, setAutomateFlags] = useState<Record<number, boolean>>({});
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ComputedStorageOrder | null>(null);
  const [calculatorMonths, setCalculatorMonths] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("aging");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [orders, setOrders] = useState<StorageOrder[]>(STORAGE_ORDERS);
  const [monthlyRateDraft, setMonthlyRateDraft] = useState("");

  const computed: ComputedStorageOrder[] = orders.map((order) => {
    const days = daysUntil(order.storageEnd);
    const status = getStatusFromDays(days);
    return { ...order, daysRemaining: days, status };
  });

  const expiringWindowDays = 90;
  const expiringOrders = computed.filter((o) => o.daysRemaining <= expiringWindowDays);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredOrders = expiringOrders.filter((order) => {
    if (!normalizedSearch) return true;
    const haystack = [order.orderName, order.orderNumber, order.company, order.location, order.status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "order") {
      cmp = a.orderName.localeCompare(b.orderName) || a.orderNumber.localeCompare(b.orderNumber);
    } else if (sortKey === "company") {
      cmp = a.company.localeCompare(b.company);
    } else if (sortKey === "storageEnd") {
      cmp = new Date(a.storageEnd).getTime() - new Date(b.storageEnd).getTime();
    } else if (sortKey === "finalDelivery") {
      const aTime = a.finalDeliveryDate ? new Date(a.finalDeliveryDate).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.finalDeliveryDate ? new Date(b.finalDeliveryDate).getTime() : Number.POSITIVE_INFINITY;
      cmp = aTime - bTime;
    } else if (sortKey === "monthlyRate") {
      cmp = a.monthlyRate - b.monthlyRate;
    } else {
      cmp = a.daysRemaining - b.daysRemaining;
    }
    return sortDirection === "asc" ? cmp : -cmp;
  });

  const summary = computed.reduce(
    (acc, o) => {
      acc.total += 1;
      if (o.status === "Overdue") acc.overdue += 1;
      else if (o.status === "Expiring Soon") acc.expiringSoon += 1;
      else acc.active += 1;
      return acc;
    },
    { total: 0, active: 0, expiringSoon: 0, overdue: 0 }
  );

  const handleRowClick = (order: ComputedStorageOrder) => {
    setSelectedOrder(order);
    setCalculatorMonths(1);
    setMonthlyRateDraft(order.monthlyRate.toString());
    setIsDetailOpen(true);
  };

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

  const effectiveMonthlyRate =
    selectedOrder && monthlyRateDraft.trim() !== "" && !Number.isNaN(Number(monthlyRateDraft))
      ? Number(monthlyRateDraft)
      : selectedOrder
        ? selectedOrder.monthlyRate
        : 0;

  const estimatedTotal = selectedOrder
    ? calculatorMonths * (Number.isFinite(effectiveMonthlyRate) ? effectiveMonthlyRate : 0)
    : 0;

  const handleLockRate = () => {
    if (!selectedOrder) return;
    const nextRate = Number(monthlyRateDraft);
    if (!Number.isFinite(nextRate) || nextRate <= 0) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === selectedOrder.id ? { ...o, monthlyRate: nextRate } : o))
    );
    setSelectedOrder((prev) => (prev ? { ...prev, monthlyRate: nextRate } : prev));
  };

  return (
    <AppPageLayout icon={Boxes} title="Storage">
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
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-2 pt-2 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  <span className="font-semibold text-slate-900">{summary.total}</span> total orders
                  in storage
                </span>
                <span>
                  • <span className="font-semibold text-emerald-700">{summary.active}</span> active
                </span>
                <span>
                  • <span className="font-semibold text-amber-700">{summary.expiringSoon}</span>{" "}
                  expiring soon
                </span>
                <span>
                  • <span className="font-semibold text-red-700">{summary.overdue}</span> overdue
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Showing orders with storage ending in the next {expiringWindowDays} days.
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,2.1fr)_minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,1.0fr)_minmax(0,0.8fr)] items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div className={getSortHeaderClass("order")} onClick={() => handleSort("order")}>
                Order
              </div>
              <div className={getSortHeaderClass("company")} onClick={() => handleSort("company")}>
                Bill to
              </div>
              <div
                className={getSortHeaderClass("storageEnd")}
                onClick={() => handleSort("storageEnd")}
              >
                Storage through
              </div>
              <div
                className={getSortHeaderClass("finalDelivery")}
                onClick={() => handleSort("finalDelivery")}
              >
                Final delivery
              </div>
              <div className={getSortHeaderClass("aging")} onClick={() => handleSort("aging")}>
                Aging
              </div>
              <div
                className={getSortHeaderClass("monthlyRate", "text-right")}
                onClick={() => handleSort("monthlyRate")}
              >
                Monthly rate
              </div>
              <div className="text-center">Automate</div>
            </div>

            {sortedOrders.map((order) => (
              <div
                key={order.id}
                className={`grid grid-cols-[minmax(0,2.1fr)_minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,1.0fr)_minmax(0,0.8fr)] items-center gap-2 border-b border-slate-100 px-4 py-2 text-xs cursor-pointer ${
                  automateFlags[order.id] ? "bg-sky-50 hover:bg-sky-100" : "bg-white hover:bg-slate-50"
                }`}
                onClick={() => handleRowClick(order)}
              >
                <div className="break-words whitespace-normal font-medium text-slate-900">
                  {order.orderName} ({order.orderNumber})
                </div>
                <div className="break-words whitespace-normal text-slate-700">{order.company}</div>
                <div className="text-xs text-slate-600">
                  {formatShortDate(order.storageEnd)}
                </div>
                <div className="text-xs text-slate-600">
                  {formatShortDate(order.finalDeliveryDate ?? null)}
                </div>
                <div className="flex items-center justify-start gap-1 text-xs font-medium text-slate-700">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${getAgingDotClasses(order.daysRemaining)}`}
                  />
                  <span>
                    {order.daysRemaining < 0
                      ? `${Math.abs(order.daysRemaining)} days overdue`
                      : `${order.daysRemaining} days`}
                  </span>
                </div>
                <div className="text-right font-medium text-slate-700">
                  {formatCurrency(order.monthlyRate)}
                </div>
                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={!!automateFlags[order.id]}
                    onCheckedChange={(checked) =>
                      setAutomateFlags((prev) => ({ ...prev, [order.id]: !!checked }))
                    }
                    className="border-slate-300 data-[state=checked]:bg-sky-700 data-[state=checked]:border-sky-700 data-[state=checked]:text-white"
                  />
                </div>
              </div>
            ))}

            {sortedOrders.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                No storage orders are expiring in the selected window.
              </div>
            )}
          </CardContent>
        </Card>

      <Dialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setSelectedOrder(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Storage details
              {selectedOrder
                ? ` – ${selectedOrder.orderName} (${selectedOrder.orderNumber})`
                : ""}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <DialogBody className="space-y-4 text-xs">
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">Order</div>
                <div className="text-slate-900">
                  {selectedOrder.orderName} ({selectedOrder.orderNumber})
                </div>
                <div className="text-xs text-slate-600">{selectedOrder.company}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Storage start
                  </div>
                  <div className="text-slate-800">{formatShortDate(selectedOrder.storageStart)}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Storage through
                  </div>
                  <div className="text-slate-800">{formatShortDate(selectedOrder.storageEnd)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Monthly rate
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      className="h-8 w-28 text-xs"
                      value={monthlyRateDraft}
                      onChange={(e) => setMonthlyRateDraft(e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={handleLockRate}
                    >
                      Lock rate
                    </Button>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Current: {formatCurrency(selectedOrder.monthlyRate)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">Aging</div>
                  <div className="flex items-center gap-1 text-xs text-slate-700">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${getAgingDotClasses(selectedOrder.daysRemaining)}`}
                    />
                    <span>
                      {selectedOrder.daysRemaining < 0
                        ? `${Math.abs(selectedOrder.daysRemaining)} days overdue`
                        : `${selectedOrder.daysRemaining} days remaining`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Estimated final delivery
                  </div>
                  <div className="text-slate-800">
                    {formatShortDate(
                      selectedOrder.estimatedFinalDeliveryDate ||
                        selectedOrder.finalDeliveryDate ||
                        null
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Last verified
                  </div>
                  <div className="text-slate-800">
                    {formatShortDate(selectedOrder.estimatedFinalDeliveryVerifiedAt ?? null)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Value of items in storage
                  </div>
                  <div className="font-semibold text-slate-900">
                    {formatCurrency(selectedOrder.storageValue ?? 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Packages in storage
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {(STORAGE_PACKAGES[selectedOrder.id] ?? []).length === 0 && (
                      <span className="text-xs text-slate-500">No package summary on file.</span>
                    )}
                    {(STORAGE_PACKAGES[selectedOrder.id] ?? []).map((pkg) => (
                      <span
                        key={pkg.type}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700"
                      >
                        {pkg.type}
                        <span className="mx-1">·</span>
                        {pkg.count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Storage calculator
                </div>
                <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)] items-center gap-3">
                  <div>
                    <div className="mb-1 text-xs text-slate-500">Months in storage</div>
                    <Input
                      type="number"
                      min={0}
                      step={0.25}
                      className="h-8 text-xs"
                      value={calculatorMonths}
                      onChange={(e) => setCalculatorMonths(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-slate-500">
                      Estimated storage total
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {formatCurrency(estimatedTotal)}
                    </div>
                  </div>
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
    </AppPageLayout>
  );
}
