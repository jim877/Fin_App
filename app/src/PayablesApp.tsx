import { useState } from "react";
import { Wallet, Printer, SlidersHorizontal } from "lucide-react";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { useGlobalSearch } from "@/contexts/GlobalSearchContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PayableStatus = "pending" | "approved" | "printed" | "paid";

type Payable = {
  id: number;
  source: "Commission" | "Referral Fee";
  payeeName: string;
  orderNumber: string;
  orderName: string;
  dueDate: string;
  amount: number;
  status: PayableStatus;
  repName?: string;
};

const SAMPLE_PAYABLES: Payable[] = [
  { id: 1, source: "Referral Fee", payeeName: "All States Restoration", repName: "RH", orderNumber: "1240703", orderName: "Lee-SomersetNJ", dueDate: "2025-11-30", amount: 865.5, status: "approved" },
  { id: 2, source: "Referral Fee", payeeName: "Gibson & Associates", repName: "DF", orderNumber: "1250578", orderName: "Garcia-MaywoodNJ", dueDate: "2025-12-05", amount: 1883.69, status: "approved" },
  { id: 3, source: "Commission", payeeName: "JC (Sales Rep)", repName: "JC", orderNumber: "1250037", orderName: "Cotton-HackettstownNJ", dueDate: "2025-11-28", amount: 1240.75, status: "approved" },
  { id: 4, source: "Commission", payeeName: "JC (Sales Rep)", repName: "JC", orderNumber: "1250818", orderName: "Schor-ChalfontPA", dueDate: "2025-12-02", amount: 430.25, status: "approved" },
  { id: 5, source: "Commission", payeeName: "JC (Sales Rep)", repName: "JC", orderNumber: "1250679", orderName: "Winterroth-YonkersNY", dueDate: "2025-12-06", amount: 980, status: "approved" },
  { id: 6, source: "Commission", payeeName: "RH (Sales Rep)", repName: "RH", orderNumber: "1240703", orderName: "Lee-SomersetNJ", dueDate: "2025-11-25", amount: 642, status: "approved" },
  { id: 7, source: "Referral Fee", payeeName: "Mark 1 Restoration / ATI", repName: "RH", orderNumber: "1250818", orderName: "Schor-ChalfontPA", dueDate: "2025-12-10", amount: 574.4, status: "paid" },
];

const REP_COLORS: Record<string, string> = {
  JC: "bg-emerald-200 text-emerald-800",
  RH: "bg-sky-200 text-sky-800",
  DF: "bg-violet-200 text-violet-800",
};

const TYPE_FILTER_OPTIONS: Payable["source"][] = ["Commission", "Referral Fee"];

function getRepColor(rep?: string) {
  if (!rep) return "bg-slate-200 text-slate-700";
  return REP_COLORS[rep] ?? "bg-slate-200 text-slate-700";
}

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function getAgingDays(dateStr: string) {
  if (!dateStr) return 0;
  const eventDate = new Date(dateStr);
  if (Number.isNaN(eventDate.getTime())) return 0;
  const now = new Date();
  const diffMs = now.getTime() - eventDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays < 0 ? 0 : diffDays;
}

function getAgingLabel(dateStr: string) {
  const diffDays = getAgingDays(dateStr);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day";
  return `${diffDays} days`;
}

type SortKey = "payee" | "rep" | "source" | "order" | "aging" | "amount";

export default function PayablesApp() {
  const { query: searchTerm } = useGlobalSearch();
  const [repFilter, setRepFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<Payable["source"][]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Record<number, boolean>>({});
  const [sortKey, setSortKey] = useState<SortKey>("payee");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const repFilterOptions = Array.from(
    new Set(SAMPLE_PAYABLES.map((p) => p.repName).filter((name): name is string => !!name))
  ).sort();

  const visiblePayables = SAMPLE_PAYABLES.filter((p) => {
    if (p.status !== "approved") return false;
    if (repFilter.length > 0 && !repFilter.includes(p.repName || "")) return false;
    if (typeFilter.length > 0 && !typeFilter.includes(p.source)) return false;
    const haystack = [p.payeeName, p.orderName, p.orderNumber, p.source]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(searchTerm.trim().toLowerCase());
  });

  const sortedPayables = [...visiblePayables].sort((a, b) => {
    let av: string | number = "";
    let bv: string | number = "";
    switch (sortKey) {
      case "payee":
        av = a.payeeName.toLowerCase();
        bv = b.payeeName.toLowerCase();
        break;
      case "rep":
        av = (a.repName || "").toLowerCase();
        bv = (b.repName || "").toLowerCase();
        break;
      case "source":
        av = a.source.toLowerCase();
        bv = b.source.toLowerCase();
        break;
      case "order":
        av = `${a.orderName} ${a.orderNumber}`.toLowerCase();
        bv = `${b.orderName} ${b.orderNumber}`.toLowerCase();
        break;
      case "aging":
        av = getAgingDays(a.dueDate);
        bv = getAgingDays(b.dueDate);
        break;
      case "amount":
        av = a.amount;
        bv = b.amount;
        break;
      default:
        break;
    }
    const cmp =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    setSortKey((current) => {
      if (current === key) {
        setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
        return current;
      }
      setSortDir("asc");
      return key;
    });
  };

  const renderSortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return <span>{sortDir === "asc" ? "▲" : "▼"}</span>;
  };

  const allSelected =
    sortedPayables.length > 0 && sortedPayables.every((p) => selectedRows[p.id]);
  const someSelected = sortedPayables.some((p) => selectedRows[p.id]);
  const filterActive = repFilter.length > 0 || typeFilter.length > 0;

  return (
    <AppPageLayout icon={Wallet} title="Expenses">
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Filter expenses</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sales rep
              </div>
              <div className="flex flex-wrap gap-2">
                {repFilterOptions.map((rep) => {
                  const active = repFilter.includes(rep);
                  return (
                    <button
                      key={rep}
                      type="button"
                      onClick={() =>
                        setRepFilter((prev) =>
                          prev.includes(rep) ? prev.filter((r) => r !== rep) : [...prev, rep]
                        )
                      }
                      className={`flex items-center gap-2 rounded-full border px-2 py-1 text-xs ${
                        active
                          ? "border-sky-600 bg-sky-50 text-sky-800"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${getRepColor(rep)}`}
                      >
                        {rep}
                      </div>
                      <span>{rep}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Type
              </div>
              <div className="flex flex-wrap gap-2">
                {TYPE_FILTER_OPTIONS.map((t) => {
                  const active = typeFilter.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setTypeFilter((prev) =>
                          prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs ${
                        active
                          ? "border-sky-600 bg-sky-50 text-sky-800"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
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
                }}
              >
                Clear
              </Button>
              <Button type="button" size="sm" onClick={() => setFiltersOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={filterActive ? "default" : "outline"}
              className={`gap-1 text-xs ${filterActive ? "bg-sky-700 text-white hover:bg-sky-800" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-xs border-slate-300 text-slate-700 hover:bg-slate-50">
              QuickBooks Sync
            </Button>
            <Button size="sm" className="gap-1 bg-sky-700 text-white hover:bg-sky-800 text-xs">
              <Printer className="h-4 w-4" />
              Print batch
            </Button>
          </div>
        </div>
        <CardHeader className="px-4 pt-3 pb-2">
          <CardTitle className="text-sm font-semibold">
            Payables ready for printing / processing
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-3">
          <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.8fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto] items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <button
                type="button"
                onClick={() => handleSort("payee")}
                className="flex items-center gap-1 justify-start text-left cursor-pointer select-none hover:text-slate-700"
              >
                <span>Payee</span>
                {renderSortIndicator("payee")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("rep")}
                className="flex items-center gap-1 justify-start text-left cursor-pointer select-none hover:text-slate-700"
              >
                <span>Rep</span>
                {renderSortIndicator("rep")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("source")}
                className="flex items-center gap-1 justify-start text-left cursor-pointer select-none hover:text-slate-700"
              >
                <span>From</span>
                {renderSortIndicator("source")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("order")}
                className="flex items-center gap-1 justify-start text-left cursor-pointer select-none hover:text-slate-700"
              >
                <span>Order</span>
                {renderSortIndicator("order")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("aging")}
                className="flex items-center gap-1 justify-start text-left cursor-pointer select-none hover:text-slate-700"
              >
                <span>Aging</span>
                {renderSortIndicator("aging")}
              </button>
              <button
                type="button"
                onClick={() => handleSort("amount")}
                className="flex items-center gap-1 justify-end text-right cursor-pointer select-none hover:text-slate-700"
              >
                <span>Amount</span>
                {renderSortIndicator("amount")}
              </button>
              <div className="flex items-center gap-1 justify-start">
                <span className="text-xs uppercase tracking-wide">Select</span>
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={(checked) => {
                    const value = checked === true;
                    if (!value) {
                      setSelectedRows({});
                    } else {
                      const next: Record<number, boolean> = {};
                      sortedPayables.forEach((p) => {
                        next[p.id] = true;
                      });
                      setSelectedRows(next);
                    }
                  }}
                  className="border-slate-300 data-[state=checked]:bg-sky-700 data-[state=checked]:border-sky-700 data-[state=checked]:text-white"
                />
              </div>
            </div>

            {sortedPayables.map((p) => (
              <div
                key={p.id}
                className={`grid grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.8fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto] items-center gap-2 border-b border-slate-100 px-4 py-2 text-xs ${
                  selectedRows[p.id] ? "bg-sky-50" : "bg-white"
                }`}
              >
                <div className="truncate font-medium text-slate-900">{p.payeeName}</div>
                <div className="flex items-center justify-start">
                  {p.repName ? (
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${getRepColor(p.repName)}`}
                    >
                      {p.repName}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </div>
                <div className="truncate text-slate-600">{p.source}</div>
                <div
                  className="truncate text-slate-600 hover:underline decoration-dotted"
                  title={p.orderName ? `${p.orderName} – ${p.orderNumber}` : p.orderNumber}
                >
                  {p.orderName ? `${p.orderName} – ${p.orderNumber}` : p.orderNumber}
                </div>
                <div className="text-xs text-slate-600">{getAgingLabel(p.dueDate)}</div>
                <div className="text-right font-semibold text-slate-900">
                  {formatCurrency(p.amount)}
                </div>
                <div className="flex items-center justify-start">
                  <Checkbox
                    checked={!!selectedRows[p.id]}
                    onCheckedChange={(checked) =>
                      setSelectedRows((prev) => ({ ...prev, [p.id]: !!checked }))
                    }
                    className="border-slate-300 data-[state=checked]:bg-sky-700 data-[state=checked]:border-sky-700 data-[state=checked]:text-white"
                  />
                </div>
              </div>
            ))}

            {sortedPayables.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-slate-500">
                <p className="font-medium text-slate-600">No expenses to print yet.</p>
                <p className="mt-1">
                  Approved payables from the <span className="font-semibold">Commissions</span> and{" "}
                  <span className="font-semibold">Referral Fees</span> sections will appear here once
                  they are marked as ready for processing.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
    </AppPageLayout>
  );
}
