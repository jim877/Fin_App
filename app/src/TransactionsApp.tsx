import { useMemo, useState } from "react";
import { Download, ListOrdered, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { useGlobalSearch } from "@/contexts/GlobalSearchContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

type TxDirection = "in" | "out";
type DatePreset = "Day" | "Week" | "Month" | "Year" | "Custom Range";

type Transaction = {
  id: number;
  source: string;
  date: string;
  orderNumber: string;
  orderName: string;
  billingCo: string;
  billTo: string;
  refCo: string;
  referrer: string;
  salesRep: string;
  transactionType: string;
  total: number;
  direction: TxDirection;
};

const RAW_TRANSACTIONS = [
  "Billing,2025-11-13,1250882,CasperZZ-NorthBergenNJ,*Self-Pay (Loss-Related),*Self-Pay (Loss-Related),*Renewal of Greater NYC,*Renewal of Greater NYC,JC,Bill,112.62,out",
  "Billing,2025-11-13,1250882,CasperZZ-NorthBergenNJ,*Self-Pay (Loss-Related),*Self-Pay (Loss-Related),*Renewal of Greater NYC,*Renewal of Greater NYC,JC,Bill,392.38,out",
  "Billing,2025-11-10,1250814,Soggs-NewYorkNY,Travelers,Travelers,*Renewal of Greater NYC,*Renewal of Greater NYC,,Bill,9741.04,out",
  "Billing,2025-11-14,1250893,Uniyal-NorthBrunswickNJ,Assurant,Assurant,*Renewal of Greater NYC,*Renewal of Greater NYC,RH,Bill,2114.61,out",
  "Billing,2025-11-11,1220030,BreckZZ-NewYorkNY,*Self-Pay (Regular Cleaning),*Self-Pay (Regular Cleaning),Chubb,Chubb,,Bill,1527.06,out",
  "Billing,2025-11-14,1240318,Silver-NewYorkNY,Chubb,Chubb,Cleaning Co - Joseph Kasson,Cleaning Co - Joseph Kasson,JC,Bill,1362.29,out",
  "Billing,2025-11-11,1250810,Norwood-NewarkNJ,Liberty Mutual,Liberty Mutual,Cleaning Co - Kevin,Cleaning Co - Kevin,JC,Bill,153.24,out",
  "Billing,2025-11-10,1250839,Kaminsky-HillsboroughNJ,State Farm,State Farm,Florez,Florez,JC,Bill,36073.12,out",
  "Billing,2025-11-10,1250873,Castro-YonkersNY,Allstate,Allstate,Cleaning Co - Lamar Townes,Cleaning Co - Lamar Townes,JC,Bill,2867.4,out",
  "Billing,2025-11-13,1250815,Helmers-NewYorkNY,Erie Insurance,Erie Insurance,Cleaning Co - Nicole Ward,Cleaning Co - Nicole Ward,JC,Bill,15217.52,out",
  "Billing,2025-11-14,1250831,Hanna-MilltownNJ,Allstate,Allstate,Gibson & Associates,Gibson & Associates,DF,Bill,9277.1,out",
  "Billing,2025-11-13,1250820,Russenbeger-CliffsideParkNJ,Focus Adjusters,Focus Adjusters,Gillespie Public Adjusters,Gillespie Public Adjusters,DF,Bill,26989.02,out",
  "Collection,2025-11-14,1240703,Lee-SomersetNJ,Safeco,Safeco,All States Restoration,All States Restoration,RH,Paid,346,in",
  "Collection,2025-11-14,1250451,Urick-ShamokinPA,State Farm,State Farm,Best Cleaners LLC PA,Best Cleaners LLC PA,RH,Paid,179.98,in",
  "Collection,2025-11-12,1240805,Nisonoff-NewYorkNY,Chubb,Chubb,Chubb,Chubb,JC,Paid,208.64,in",
  "Collection,2025-11-10,1250679,Winterroth-YonkersNY,Travelers,Travelers,Cleaning Co - German Arana,Cleaning Co - German Arana,JC,Paid,33512.4,in",
  "Collection,2025-11-12,1240774,Phillips-JamaicaQNY,Allstate,Allstate,Cleaning Co - Kevin Florez,Cleaning Co - Kevin Florez,JC,Paid,216,in",
  "Collection,2025-11-14,1250220,Parry-NewYorkNY,Allstate,Allstate,Cleaning Co - Lamar Townes,Cleaning Co - Lamar Townes,JC,Paid,7549.97,in",
  "Collection,2025-11-14,1250578,Garcia-MaywoodNJ,Decker Associates,Decker Associates,Gibson & Associates,Gibson & Associates,DF,Paid,23546.15,in",
  "Collection,2025-11-14,1240653,Filenbaum-NewYorkNY,Cincinnati Insurance,Cincinnati Insurance,Four Seasons Restoration,Four Seasons Restoration,JC,WriteOff,51.4,in",
  "Collection,2025-11-14,1250792,SerjoorieBarber-,Liberty Mutual,Liberty Mutual,Cleaning Co Roman,Cleaning Co Roman,JC,Paid,4878.92,in",
  "Collection,2025-11-14,1230210,Qureshi-PrincetonNJ,Farmers Insurance,Farmers Insurance,Farmers Insurance,Farmers Insurance,DF,Paid,6419.48,in",
  "Collection,2025-11-12,1250683,Grunfeld-NewYorkNY,Cincinnati Insurance,Cincinnati Insurance,Four Seasons Restoration,Four Seasons Restoration,JC,Paid,13765.45,in",
  "Collection,2025-11-12,1250562,Vegalara-NewYorkNY,Chubb,Chubb,Four Seasons Restoration,Four Seasons Restoration,JC,Paid,894.4,in",
  "Collection,2025-11-13,1250037,Cotton-HackettstownNJ,National General Insurance,National General Insurance,Gemini Restoration Inc.,Gemini Restoration Inc.,DF,Paid,5027.55,in",
  "Collection,2025-11-14,1250043,Pulver-HighlandMillsNY,State Farm,State Farm,JD Claims,JD Claims,MA,WriteOff,60,in",
  "Collection,2025-11-14,1250818,Schor-ChalfontPA,USAA,USAA,Mark 1 Restoration/ ATI - Chalfont PA,Mark 1 Restoration/ ATI - Chalfont PA,RH,Paid,574.4,in",
  "Commission,2025-11-15,1250815,Helmers-NewYorkNY,*Commission,*Commission,Cleaning Co - Nicole Ward,Cleaning Co - Nicole Ward,JC,Commission,750.0,out",
  "Commission,2025-11-16,1250873,Castro-YonkersNY,*Commission,*Commission,Cleaning Co - Lamar Townes,Cleaning Co - Lamar Townes,JC,Commission,540.0,out",
  "Referral Fee,2025-11-15,1240703,Lee-SomersetNJ,*Referral Fee,*Referral Fee,All States Restoration,All States Restoration,RH,Referral Fee,500.0,out",
  "Referral Fee,2025-11-16,1250220,Parry-NewYorkNY,*Referral Fee,*Referral Fee,Cleaning Co - Lamar Townes,Cleaning Co - Lamar Townes,JC,Referral Fee,320.0,out",
] as const;

const DATE_PRESETS: DatePreset[] = ["Day", "Week", "Month", "Year", "Custom Range"];

const FILTER_CHECKBOX_CLASS =
  "relative border-slate-300 data-[state=checked]:bg-sky-700 data-[state=checked]:border-sky-700 data-[state=indeterminate]:bg-sky-700 data-[state=indeterminate]:border-sky-700 data-[state=checked]:text-white data-[state=indeterminate]:text-white focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-0 data-[state=indeterminate]:[&>span]:opacity-0 after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:h-[2px] after:w-3 after:rounded after:bg-white after:opacity-0 data-[state=indeterminate]:after:opacity-100";

const FILTER_INPUT_CLASS =
  "focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-0 focus-visible:border-sky-300";

const REP_BADGE_STYLES = [
  "bg-sky-700 text-white",
  "bg-emerald-600 text-white",
  "bg-violet-600 text-white",
  "bg-amber-500 text-white",
  "bg-rose-600 text-white",
  "bg-indigo-600 text-white",
  "bg-teal-600 text-white",
  "bg-cyan-600 text-white",
] as const;

const getRepBadgeClass = (rep: string) => {
  const s = (rep || "").trim();
  if (!s) return "bg-slate-200 text-slate-700";
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return REP_BADGE_STYLES[hash % REP_BADGE_STYLES.length];
};

const toUtcMidnightMs = (ymd: string) => {
  const parts = ymd.split("-");
  if (parts.length !== 3) return Number.NaN;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return Number.NaN;
  return Date.UTC(y, m - 1, d);
};

const formatDateLabel = (ymd: string) => {
  const ms = toUtcMidnightMs(ymd);
  if (!Number.isFinite(ms)) return ymd;
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
};

const SAMPLE_TRANSACTIONS: Transaction[] = RAW_TRANSACTIONS.map((row, index) => {
  const [
    source,
    date,
    orderNumber,
    orderName,
    billingCo,
    billTo,
    refCo,
    referrer,
    salesRep,
    transactionType,
    total,
    direction,
  ] = row.split(",");

  const dir: TxDirection = direction === "in" ? "in" : "out";

  return {
    id: index + 1,
    source: source || "",
    date: date || "",
    orderNumber: orderNumber || "",
    orderName: orderName || "",
    billingCo: billingCo || "",
    billTo: billTo || "",
    refCo: refCo || "",
    referrer: referrer || "",
    salesRep: salesRep || "",
    transactionType: transactionType || "",
    total: Number(total),
    direction: dir,
  };
});

const groupTransactionsByDate = (transactions: Transaction[]) =>
  transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    (acc[tx.date] ||= []).push(tx);
    return acc;
  }, {});

const getInitials = (name: string) => {
  const cleaned = name.split(".").join("").trim();
  if (!cleaned) return "";
  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatCurrency = (value: number) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  if (/[\"\n,]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const buildTransactionsCsv = (txs: Transaction[]) => {
  const header = [
    "source",
    "date",
    "orderNumber",
    "orderName",
    "billingCo",
    "billTo",
    "refCo",
    "referrer",
    "salesRep",
    "transactionType",
    "total",
    "direction",
  ].join(",");

  const rows = txs.map((tx) =>
    [
      tx.source,
      tx.date,
      tx.orderNumber,
      tx.orderName,
      tx.billingCo,
      tx.billTo,
      tx.refCo,
      tx.referrer,
      tx.salesRep,
      tx.transactionType,
      tx.total,
      tx.direction,
    ]
      .map(csvCell)
      .join(",")
  );

  return [header, ...rows].join("\n");
};

const downloadTextFile = (filename: string, text: string, mime: string) => {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const exportTransactionsToCsv = (txs: Transaction[]) => {
  const ymd = new Date().toISOString().slice(0, 10);
  const csv = buildTransactionsCsv(txs);
  downloadTextFile(`transactions_${ymd}.csv`, csv, "text/csv;charset=utf-8;");
};

export default function TransactionsApp() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { query: searchTerm, setQuery: setSearchTerm } = useGlobalSearch();
  const [datePreset, setDatePreset] = useState<DatePreset>("Month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [salesRepFilter, setSalesRepFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [billingCoFilter, setBillingCoFilter] = useState<string[]>([]);
  const [refCoFilter, setRefCoFilter] = useState<string[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const latestMs = useMemo(() => {
    if (SAMPLE_TRANSACTIONS.length === 0) return null;
    const ms = SAMPLE_TRANSACTIONS.map((t) => toUtcMidnightMs(t.date)).filter((n) => Number.isFinite(n));
    if (ms.length === 0) return null;
    return Math.max(...ms);
  }, []);

  const filteredTransactions = useMemo(() => {
    const normSearch = searchTerm.trim().toLowerCase();

    return SAMPLE_TRANSACTIONS.filter((tx) => {
      if (normSearch) {
        const hay = [tx.orderName, tx.orderNumber, tx.billingCo, tx.billTo, tx.refCo, tx.referrer, tx.salesRep]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(normSearch)) return false;
      }

      if (salesRepFilter.length && !salesRepFilter.includes(tx.salesRep || "")) return false;
      if (typeFilter.length && !typeFilter.includes(tx.transactionType)) return false;
      if (billingCoFilter.length && !billingCoFilter.includes(tx.billingCo)) return false;
      if (refCoFilter.length && !refCoFilter.includes(tx.refCo || "")) return false;

      if (datePreset === "Custom Range") {
        if (dateFrom && tx.date < dateFrom) return false;
        if (dateTo && tx.date > dateTo) return false;
      } else if (latestMs) {
        const txMs = toUtcMidnightMs(tx.date);
        if (!Number.isFinite(txMs)) return false;
        const diffDays = (latestMs - txMs) / 86400000;
        if (datePreset === "Day" && diffDays > 1) return false;
        if (datePreset === "Week" && diffDays > 7) return false;
        if (datePreset === "Month" && diffDays > 31) return false;
        if (datePreset === "Year" && diffDays > 365) return false;
      }

      return true;
    });
  }, [searchTerm, datePreset, dateFrom, dateTo, salesRepFilter, typeFilter, billingCoFilter, refCoFilter, latestMs]);

  const filterActive =
    searchTerm !== "" ||
    datePreset !== "Month" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    salesRepFilter.length > 0 ||
    typeFilter.length > 0 ||
    billingCoFilter.length > 0 ||
    refCoFilter.length > 0;

  const activeFilterCount =
    (searchTerm ? 1 : 0) +
    (datePreset !== "Month" ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0) +
    salesRepFilter.length +
    typeFilter.length +
    billingCoFilter.length +
    refCoFilter.length;

  const resetFilters = () => {
    setSearchTerm("");
    setDatePreset("Month");
    setDateFrom("");
    setDateTo("");
    setSalesRepFilter([]);
    setTypeFilter([]);
    setBillingCoFilter([]);
    setRefCoFilter([]);
  };

  return (
    <AppPageLayout icon={ListOrdered} title="Transactions">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="gap-1 bg-sky-700 text-white hover:bg-sky-800"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={filteredTransactions.length === 0}
            onClick={() => exportTransactionsToCsv(filteredTransactions)}
            className="gap-1 border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen((p) => !p)}
            className={`gap-1 text-xs ${
              filterActive || isFilterOpen
                ? "bg-sky-700 text-white hover:bg-sky-800"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter
            {filterActive && (
              <span className="ml-1 rounded-full bg-white/20 px-1.5 text-xs font-bold">{activeFilterCount}</span>
            )}
          </Button>
          {filterActive && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>
      <TransactionsList
          transactions={filteredTransactions}
          onOpenTransaction={(tx) => {
            setSelectedTx(tx);
            setDetailOpen(true);
          }}
        />

        <FilterDialog
          open={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          datePreset={datePreset}
          onDatePresetChange={setDatePreset}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          salesRepFilter={salesRepFilter}
          onSalesRepFilterChange={setSalesRepFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          billingCoFilter={billingCoFilter}
          onBillingCoFilterChange={setBillingCoFilter}
          refCoFilter={refCoFilter}
          onRefCoFilterChange={setRefCoFilter}
        />

        <AddTransactionDialog open={isAddOpen} onOpenChange={setIsAddOpen} />

        <TransactionDetailDrawer
          open={detailOpen && !!selectedTx}
          onOpenChange={(v) => {
            setDetailOpen(v);
            if (!v) setSelectedTx(null);
          }}
          tx={selectedTx}
        />
    </AppPageLayout>
  );
}

function TransactionsList({
  transactions,
  onOpenTransaction,
}: {
  transactions: Transaction[];
  onOpenTransaction: (tx: Transaction) => void;
}) {
  const grouped = useMemo(() => groupTransactionsByDate(transactions), [transactions]);
  const sortedDates = useMemo(() => Object.keys(grouped).sort((a, b) => b.localeCompare(a)), [grouped]);

  return (
    <Card className="h-full border-slate-200 bg-slate-50 shadow-none">
      <CardHeader className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">All Transactions</CardTitle>
          <p className="text-sm text-slate-600">
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
          {sortedDates.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <p>No transactions match the current filters.</p>
            </div>
          ) : (
            sortedDates.map((date) => (
              <div key={date}>
                <div className="sticky top-0 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  {formatDateLabel(date)}
                </div>
                <div className="grid grid-cols-[2fr_1.6fr_1.6fr_auto_1fr_1fr] gap-3 px-4 py-1 text-xs font-semibold uppercase text-slate-500 bg-slate-50">
                  <div>Order</div>
                  <div>Billing Co</div>
                  <div>Referring Co</div>
                  <div className="text-center">Rep</div>
                  <div>Type</div>
                  <div className="text-right">Amount</div>
                </div>
                {grouped[date].map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => onOpenTransaction(tx)}
                    className="grid grid-cols-[2fr_1.6fr_1.6fr_auto_1fr_1fr] gap-3 px-4 py-3 text-sm border-b border-slate-100 hover:bg-white cursor-pointer"
                  >
                    <div className="font-medium truncate">{tx.orderName}</div>
                    <div className="truncate text-slate-600">{tx.billingCo}</div>
                    <div className="truncate text-slate-600">{tx.refCo || "-"}</div>
                    <div className="flex justify-center">
                      {tx.salesRep ? (
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${getRepBadgeClass(
                            tx.salesRep
                          )}`}
                        >
                          {getInitials(tx.salesRep)}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">--</span>
                      )}
                    </div>
                    <div className="truncate text-slate-600">{tx.transactionType}</div>
                    <div
                      className={`text-right font-semibold ${
                        tx.transactionType === "WriteOff"
                          ? "text-red-600"
                          : tx.direction === "in"
                            ? "text-emerald-600"
                            : "text-slate-900"
                      }`}
                    >
                      {formatCurrency(tx.total)}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FilterSection({
  title,
  options,
  selected,
  onChange,
  search,
  onSearchChange,
}: {
  title: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((item) => item.toLowerCase().includes(q));
  }, [options, search]);

  const allSelected = useMemo(
    () => options.length > 0 && options.every((v) => selected.includes(v)),
    [options, selected]
  );
  const allVisibleSelected = useMemo(
    () => visible.length > 0 && visible.every((v) => selected.includes(v)),
    [visible, selected]
  );
  const someVisibleSelected = useMemo(() => visible.some((v) => selected.includes(v)), [visible, selected]);

  const selectAllChecked: boolean | "indeterminate" = allVisibleSelected
    ? true
    : someVisibleSelected
      ? "indeterminate"
      : false;

  const toggleAllShown = () => {
    if (visible.length === 0) return;
    if (allVisibleSelected) {
      onChange(selected.filter((s) => !visible.includes(s)));
    } else {
      onChange(Array.from(new Set([...selected, ...visible])));
    }
  };

  return (
    <div className="space-y-1.5 px-0.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</Label>
      <div className="rounded border border-slate-200 bg-white">
        <div className="relative px-1.5 pt-1 pb-0.5">
          <Input
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`h-7 pl-7 pr-7 text-xs ${FILTER_INPUT_CLASS}`}
          />
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              aria-label="Clear filter search"
            >
              <X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
        <div className="max-h-36 overflow-y-auto px-2 pb-2 space-y-0.5">
          {visible.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-2">No matches</p>
          ) : (
            <>
              <label className="flex items-center gap-1.5 py-0.5">
                <Checkbox
                  className={FILTER_CHECKBOX_CLASS}
                  checked={allSelected}
                  onCheckedChange={(c) => {
                    if (c === true) onChange(options);
                    else onChange([]);
                  }}
                />
                <span className="text-xs text-slate-600">All {title.toLowerCase()}</span>
              </label>
              <label className="flex items-center gap-1.5 py-0.5">
                <Checkbox className={FILTER_CHECKBOX_CLASS} checked={selectAllChecked} onCheckedChange={toggleAllShown} />
                <span className="text-xs font-medium text-slate-600">Select all shown ({visible.length})</span>
              </label>
              <div className="h-px bg-slate-200 my-1" />
              {visible.map((item) => (
                <label key={item} className="flex items-center gap-1.5 py-0.5 min-h-0">
                  <Checkbox
                    className={FILTER_CHECKBOX_CLASS}
                    checked={selected.includes(item)}
                    onCheckedChange={(checked) =>
                      onChange(checked === true ? [...selected, item] : selected.filter((s) => s !== item))
                    }
                  />
                  <span className="text-xs truncate">{item}</span>
                </label>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterDialog({
  open,
  onOpenChange,
  datePreset,
  onDatePresetChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  salesRepFilter,
  onSalesRepFilterChange,
  typeFilter,
  onTypeFilterChange,
  billingCoFilter,
  onBillingCoFilterChange,
  refCoFilter,
  onRefCoFilterChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  datePreset: DatePreset;
  onDatePresetChange: (v: DatePreset) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  salesRepFilter: string[];
  onSalesRepFilterChange: (v: string[]) => void;
  typeFilter: string[];
  onTypeFilterChange: (v: string[]) => void;
  billingCoFilter: string[];
  onBillingCoFilterChange: (v: string[]) => void;
  refCoFilter: string[];
  onRefCoFilterChange: (v: string[]) => void;
}) {
  const [repSearch, setRepSearch] = useState("");
  const [typeSearch, setTypeSearch] = useState("");
  const [billingSearch, setBillingSearch] = useState("");
  const [refSearch, setRefSearch] = useState("");

  const options = useMemo(() => {
    const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean))).sort();
    return {
      salesRep: uniq(SAMPLE_TRANSACTIONS.map((t) => t.salesRep)),
      type: uniq(SAMPLE_TRANSACTIONS.map((t) => t.transactionType)),
      billingCo: uniq(SAMPLE_TRANSACTIONS.map((t) => t.billingCo)),
      refCo: uniq(SAMPLE_TRANSACTIONS.map((t) => t.refCo)),
    };
  }, []);

  const reset = () => {
    onDatePresetChange("Month");
    onDateFromChange("");
    onDateToChange("");
    onSalesRepFilterChange([]);
    onTypeFilterChange([]);
    onBillingCoFilterChange([]);
    onRefCoFilterChange([]);
    setRepSearch("");
    setTypeSearch("");
    setBillingSearch("");
    setRefSearch("");
  };

  const activeFilters: Array<{ label: string; value: string }> = [];
  if (datePreset !== "Month" || dateFrom || dateTo) {
    activeFilters.push({
      label: "Date",
      value: datePreset === "Custom Range" ? `${dateFrom || "Start"} to ${dateTo || "End"}` : datePreset,
    });
  }
  if (salesRepFilter.length) activeFilters.push({ label: "Sales Rep", value: `${salesRepFilter.length} selected` });
  if (typeFilter.length) activeFilters.push({ label: "Type", value: `${typeFilter.length} selected` });
  if (billingCoFilter.length)
    activeFilters.push({ label: "Billing Co", value: `${billingCoFilter.length} selected` });
  if (refCoFilter.length)
    activeFilters.push({ label: "Referring Co", value: `${refCoFilter.length} selected` });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Filter Transactions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-6 pb-5">
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">Date Range</Label>
                <Tabs value={datePreset} onValueChange={(v) => onDatePresetChange(v as DatePreset)}>
                  <TabsList className="mt-2 grid grid-cols-5 gap-0.5 p-1">
                    {DATE_PRESETS.map((p) => (
                      <TabsTrigger key={p} value={p} className="px-2 py-1.5 text-xs">
                        {p}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                {datePreset === "Custom Range" && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <Label className="text-xs text-slate-500">From</Label>
                      <Input
                        type="date"
                        className={`h-7 text-xs mt-0.5 ${FILTER_INPUT_CLASS}`}
                        value={dateFrom}
                        onChange={(e) => onDateFromChange(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">To</Label>
                      <Input
                        type="date"
                        className={`h-7 text-xs mt-0.5 ${FILTER_INPUT_CLASS}`}
                        value={dateTo}
                        onChange={(e) => onDateToChange(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Active Filters</span>
                  <span className="text-xs text-slate-500">{activeFilters.length} active</span>
                </div>
                {activeFilters.length === 0 ? (
                  <div className="mt-2 text-xs text-slate-500">No filters applied</div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activeFilters.map((f) => (
                      <div
                        key={f.label}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${
                          f.label === "Date"
                            ? "border-sky-200 bg-sky-50 text-sky-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        <span className={f.label === "Date" ? "font-semibold text-sky-700" : "font-semibold text-slate-700"}>
                          {f.label}
                        </span>
                        <span>{f.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <FilterSection
                title="Sales Rep"
                options={options.salesRep}
                selected={salesRepFilter}
                onChange={onSalesRepFilterChange}
                search={repSearch}
                onSearchChange={setRepSearch}
              />
              <FilterSection
                title="Transaction Type"
                options={options.type}
                selected={typeFilter}
                onChange={onTypeFilterChange}
                search={typeSearch}
                onSearchChange={setTypeSearch}
              />
              <FilterSection
                title="Billing Company"
                options={options.billingCo}
                selected={billingCoFilter}
                onChange={onBillingCoFilterChange}
                search={billingSearch}
                onSearchChange={setBillingSearch}
              />
              <FilterSection
                title="Referring Company"
                options={options.refCo}
                selected={refCoFilter}
                onChange={onRefCoFilterChange}
                search={refSearch}
                onSearchChange={setRefSearch}
              />
            </div>
          </div>

          <div className="sticky bottom-0 -mx-6 -mb-6 mt-4 flex justify-between items-center border-t bg-white px-6 py-3">
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={reset}>
              Reset All
            </Button>
            <Button size="sm" className="text-xs h-8 bg-sky-700 text-white hover:bg-sky-800" onClick={() => onOpenChange(false)}>
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddTransactionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <div className="py-12 text-center text-slate-500">
          <p>Form fields go here</p>
          <p className="text-sm mt-2">(Ready for implementation)</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TransactionDetailDrawer({
  open,
  onOpenChange,
  tx,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tx: Transaction | null;
}) {
  if (!tx) return null;

  const amountClass =
    tx.transactionType === "WriteOff" ? "text-red-600" : tx.direction === "in" ? "text-emerald-600" : "text-slate-900";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!fixed !right-0 !top-0 !left-auto !translate-x-0 !translate-y-0 h-[100vh] w-full max-w-md rounded-none border-l border-slate-200 bg-white p-0 shadow-2xl [&>button.absolute]:top-6 [&>button.absolute]:right-6 [&>button.absolute]:z-20 [&>button.absolute]:h-10 [&>button.absolute]:w-10 [&>button.absolute]:rounded-xl [&>button.absolute]:border [&>button.absolute]:border-slate-200 [&>button.absolute]:bg-white [&>button.absolute]:text-slate-500 [&>button.absolute:hover]:bg-slate-100 [&>button.absolute:hover]:text-slate-700 [&>button.absolute]:shadow-sm">
        <DialogHeader className="sr-only">
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>

        <div className="border-b border-slate-200 px-5 py-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transaction</div>
            <div className="text-lg font-semibold leading-tight">{tx.orderName || "(untitled)"}</div>
            <div className="text-xs text-slate-500">Order #{tx.orderNumber || "-"}</div>
          </div>
        </div>

        <div className="max-h-[calc(100vh-84px)] overflow-y-auto px-5 py-5">
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</div>
                  <div className={`mt-1 text-2xl font-semibold ${amountClass}`}>{formatCurrency(tx.total)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{formatDateLabel(tx.date)}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{tx.transactionType || "-"}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Direction</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{tx.direction === "in" ? "Inbound" : "Outbound"}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Parties</div>
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Billing Company</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{tx.billingCo || "-"}</div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Bill To</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{tx.billTo || "-"}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Referring Company</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{tx.refCo || "-"}</div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Referrer</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{tx.referrer || "-"}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attribution</div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sales Rep</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">{tx.salesRep || "-"}</div>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ring-1 ring-slate-200">
                    {tx.salesRep ? (
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${getRepBadgeClass(tx.salesRep)}`}>
                        {getInitials(tx.salesRep)}
                      </div>
                    ) : (
                      <span className="text-slate-400">--</span>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">{tx.source || "-"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">ID</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">#{tx.id}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type SelfTestResult = { name: string; pass: boolean };

export const TRANSACTIONS_APP_TESTS: SelfTestResult[] = [
  {
    name: "toUtcMidnightMs parses valid ymd",
    pass: toUtcMidnightMs("2025-11-13") === Date.UTC(2025, 10, 13),
  },
  {
    name: "toUtcMidnightMs returns NaN on invalid input",
    pass: Number.isNaN(toUtcMidnightMs("bad")),
  },
  {
    name: "formatCurrency formats numeric",
    pass: formatCurrency(12.5).includes("12") && formatCurrency(12.5).includes(".50"),
  },
  {
    name: "getInitials returns two letters for two-part names",
    pass: getInitials("Jim Fen") === "JF",
  },
  {
    name: "getInitials returns up to two letters for single token",
    pass: getInitials("JC") === "JC",
  },
  {
    name: "csvCell quotes commas and doubles quotes",
    pass: (() => {
      const out = csvCell('a,"b"');
      return out === '"a,""b"""';
    })(),
  },
  {
    name: "buildTransactionsCsv includes header and at least one row",
    pass: (() => {
      const csv = buildTransactionsCsv(SAMPLE_TRANSACTIONS.slice(0, 1));
      const lines = csv.split("\n").filter(Boolean);
      return lines.length === 2 && lines[0].includes("orderName") && lines[1].includes("Billing");
    })(),
  },
  {
    name: "buildTransactionsCsv uses newline separators",
    pass: (() => {
      const csv = buildTransactionsCsv(SAMPLE_TRANSACTIONS.slice(0, 2));
      const lines = csv.split("\n").filter(Boolean);
      return lines.length === 3;
    })(),
  },
];

export const runTransactionsAppSelfTest = () => {
  const failed = TRANSACTIONS_APP_TESTS.filter((t) => !t.pass);
  return { pass: failed.length === 0, failed };
};
