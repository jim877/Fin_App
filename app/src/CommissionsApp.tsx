import { useState } from "react";
import { Percent, Plus, Settings, SlidersHorizontal } from "lucide-react";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { useGlobalSearch } from "@/contexts/GlobalSearchContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COMMISSION_STATUS_OPTIONS = [
  "Paid-Deposit",
  "Paid-Partial Paid",
  "Paid (unbilled)",
  "Sup (unbilled)",
  "Paid in Full",
  "Sent to Collections",
] as const;

type CommissionStatus = (typeof COMMISSION_STATUS_OPTIONS)[number];

const RAW_TRANSACTIONS = [
  "Billing,2025-11-13,1250882,CasperZZ-NorthBergenNJ,*Self-Pay (Loss-Related),*Self-Pay (Loss-Related),*Renewal of Greater NYC,*Renewal of Greater NYC,JC,Bill,112.62,out",
  "Billing,2025-11-13,1250882,CasperZZ-NorthBergenNJ,*Self-Pay (Loss-Related),*Self-Pay (Loss-Related),*Renewal of Greater NYC,*Renewal of Greater NYC,JC,Bill,392.38,out",
  "Billing,2025-11-10,1250814,Soggs-NewYorkNY,Travelers,Travelers,*Renewal of Greater NYC,*Renewal of Greater NYC,,Bill,9741.04,out",
  "Billing,2025-11-14,1250893,Uniyal-NorthBrunswickNJ,Assurant,Assurant,*Renewal of Greater NYC,*Renewal of Greater NYC,RH,Bill,2114.61,out",
  "Collection,2025-11-14,1240703,Lee-SomersetNJ,Safeco,Safeco,All States Restoration,All States Restoration,RH,Paid,346,in",
  "Collection,2025-11-14,1250451,Urick-ShamokinPA,State Farm,State Farm,Best Cleaners LLC PA,Best Cleaners LLC PA,RH,Paid,179.98,in",
  "Collection,2025-11-12,1240805,Nisonoff-NewYorkNY,Chubb,Chubb,Chubb,Chubb,JC,Paid,208.64,in",
  "Collection,2025-11-10,1250679,Winterroth-YonkersNY,Travelers,Travelers,Cleaning Co - German Arana,Cleaning Co - German Arana,JC,Paid,33512.4,in",
  "Collection,2025-11-12,1240774,Phillips-JamaicaQNY,Allstate,Allstate,Cleaning Co - Kevin Florez,Cleaning Co - Kevin Florez,JC,Paid,216,in",
  "Collection,2025-11-14,1250220,Parry-NewYorkNY,Allstate,Allstate,Cleaning Co - Lamar Townes,Cleaning Co - Lamar Townes,JC,Paid,7549.97,in",
  "Collection,2025-11-14,1250578,Garcia-MaywoodNJ,Decker Associates,Decker Associates,Gibson & Associates,Gibson & Associates,DF,Paid,23546.15,in",
  "Collection,2025-11-14,1250792,SerjoorieBarber-,Liberty Mutual,Liberty Mutual,Cleaning Co Roman,Cleaning Co Roman,JC,Paid,4878.92,in",
  "Collection,2025-11-14,1230210,Qureshi-PrincetonNJ,Farmers Insurance,Farmers Insurance,Farmers Insurance,Farmers Insurance,DF,Paid,6419.48,in",
  "Collection,2025-11-12,1250683,Grunfeld-NewYorkNY,Cincinnati Insurance,Cincinnati Insurance,Four Seasons Restoration,Four Seasons Restoration,JC,Paid,13765.45,in",
  "Collection,2025-11-12,1250562,Vegalara-NewYorkNY,Chubb,Chubb,Four Seasons Restoration,Four Seasons Restoration,JC,Paid,894.4,in",
  "Collection,2025-11-13,1250037,Cotton-HackettstownNJ,National General Insurance,National General Insurance,Gemini Restoration Inc.,Gemini Restoration Inc.,DF,Paid,5027.55,in",
  "Collection,2025-11-14,1250818,Schor-ChalfontPA,USAA,USAA,Mark 1 Restoration/ ATI - Chalfont PA,Mark 1 Restoration/ ATI - Chalfont PA,RH,Paid,574.4,in",
];

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
  direction: string;
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
  return {
    id: index + 1,
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
    total: Number(total),
    direction,
  };
});

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function formatShortDate(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

type CommissionOrderRow = {
  key: string;
  company: string;
  referrer: string;
  rep: string;
  orderName: string;
  orderNumber: string;
  billed: number;
  collected: number;
  collectionDate: string | null;
};

type PercentageUnit = "%" | "$";

type CommissionRuleSettings = {
  active: boolean;
  baseAmount: "billed" | "collected";
  netReferralFees: boolean;
  netProgramFees: boolean;
  netDiscounts: boolean;
  netTaxes: boolean;
  percentageType: "variable";
  repeatCustomerPercent: number;
  newSourceUnit: PercentageUnit;
  newSourceValue: number;
  repGeneratedUnit: PercentageUnit;
  repGeneratedValue: number;
  notes: string;
};

function buildCommissionOrderRows(transactions: Transaction[]): CommissionOrderRow[] {
  const map: Record<string, CommissionOrderRow> = {};

  transactions.forEach((tx) => {
    const companyRaw = tx.refCo || tx.billingCo || "(No company)";
    const company = companyRaw.trim();
    const referrerRaw = tx.referrer || "";
    const referrer = referrerRaw.trim();
    const rep = (tx.salesRep || "").trim();
    if (!company && !rep && !referrer) return;

    const key = `${company}__${tx.orderNumber}`;

    if (!map[key]) {
      map[key] = {
        key,
        company,
        referrer,
        rep,
        orderName: tx.orderName,
        orderNumber: tx.orderNumber,
        billed: 0,
        collected: 0,
        collectionDate: null,
      };
    }

    if (tx.transactionType === "Bill") {
      map[key].billed += tx.total;
    }
    if (tx.transactionType === "Paid") {
      map[key].collected += tx.total;
      const current = map[key].collectionDate;
      if (!current || new Date(tx.date) > new Date(current)) {
        map[key].collectionDate = tx.date;
      }
    }
  });

  return Object.values(map)
    .filter((row) => row.collected > 0)
    .sort((a, b) => {
      const byCompany = a.company.localeCompare(b.company);
      if (byCompany !== 0) return byCompany;
      return a.orderName.localeCompare(b.orderName);
    });
}

function calculateCommissionForRow(
  row: CommissionOrderRow,
  baseAmount: "billed" | "collected",
  settings: CommissionRuleSettings
) {
  if (!settings.active) {
    return { repOwed: 0, totalOwed: 0 };
  }

  const revenue = baseAmount === "collected" ? row.collected : row.billed;
  const rateValue = settings.repGeneratedValue;
  const rateUnit = settings.repGeneratedUnit;
  const repOwed = rateUnit === "%" ? revenue * (rateValue / 100) : rateValue;
  return { repOwed, totalOwed: repOwed };
}

export default function CommissionsApp() {
  const { query: searchTerm } = useGlobalSearch();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [feeBasis, setFeeBasis] = useState<"billed" | "collected">("collected");
  const [ruleSettings, setRuleSettings] = useState<CommissionRuleSettings>({
    active: true,
    baseAmount: "collected",
    netReferralFees: true,
    netProgramFees: true,
    netDiscounts: true,
    netTaxes: true,
    percentageType: "variable",
    repeatCustomerPercent: 5,
    newSourceUnit: "%",
    newSourceValue: 10,
    repGeneratedUnit: "%",
    repGeneratedValue: 15,
    notes: "",
  });

  const [approvedRows, setApprovedRows] = useState<Record<string, boolean>>({});
  const [rowStatuses, setRowStatuses] = useState<Record<string, CommissionStatus>>({});
  const [paidFlags, setPaidFlags] = useState<Record<string, boolean>>({});
  const [archivedRowKeys, setArchivedRowKeys] = useState<Record<string, boolean>>({});
  const [lastUpdateSummary, setLastUpdateSummary] = useState<string | null>(null);

  const baseRows = buildCommissionOrderRows(SAMPLE_TRANSACTIONS);
  const allRows = baseRows.filter((row) => !archivedRowKeys[row.key]);

  const stats = allRows.reduce(
    (acc, row) => {
      const approved = !!approvedRows[row.key];
      const paid = !!paidFlags[row.key];
      if (paid) acc.paid += 1;
      else if (approved) acc.approved += 1;
      else acc.pending += 1;
      return acc;
    },
    { pending: 0, approved: 0, paid: 0 }
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRows = allRows.filter((row) => {
    if (!normalizedSearch) return true;
    const haystack = [
      row.company,
      row.referrer,
      row.rep,
      row.orderName,
      row.orderNumber,
      row.collectionDate ?? "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    const aApproved = !!approvedRows[a.key];
    const bApproved = !!approvedRows[b.key];
    if (aApproved !== bApproved) return aApproved ? 1 : -1;
    const byCompany = a.company.localeCompare(b.company);
    if (byCompany !== 0) return byCompany;
    return a.orderName.localeCompare(b.orderName);
  });

  const handleSubmitToExpenses = () => {
    const rowsToArchive = allRows.filter(
      (row) => approvedRows[row.key] && !paidFlags[row.key]
    );

    if (rowsToArchive.length === 0) {
      setLastUpdateSummary("No approved commissions to submit.");
      return;
    }

    setArchivedRowKeys((prev) => {
      const next = { ...prev };
      rowsToArchive.forEach((row) => {
        next[row.key] = true;
      });
      return next;
    });

    setLastUpdateSummary(
      `Submitted ${rowsToArchive.length} commission${rowsToArchive.length === 1 ? "" : "s"} to Expenses.`
    );
  };

  return (
    <AppPageLayout icon={Percent} title="Commissions">
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
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-slate-300 text-slate-700 hover:bg-slate-50"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
              Commission settings
            </Button>
          </div>
        </div>
        <CardContent className="px-0 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-2 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  <span className="font-semibold text-slate-900">{stats.pending}</span> pending
                </span>
                <span>
                  • <span className="font-semibold text-slate-900">{stats.approved}</span> approved
                </span>
                <span>
                  • <span className="font-semibold text-slate-900">{stats.paid}</span> paid
                </span>
                {lastUpdateSummary && (
                  <span className="text-emerald-700">· {lastUpdateSummary}</span>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                className="h-7 px-3 text-xs bg-sky-700 text-white hover:bg-sky-800"
                onClick={handleSubmitToExpenses}
              >
                Submit approved to Expenses
              </Button>
            </div>

            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.9fr)_auto_minmax(0,1.6fr)_minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,0.7fr)] items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div>Order</div>
              <div>Date</div>
              <div className="text-center">Rep</div>
              <div>Referrer</div>
              <div className="text-right">Collected</div>
              <div className="text-right">Estimated Commission</div>
              <div>Status</div>
              <div className="text-center">Commission Paid?</div>
              <div className="text-center">Approve</div>
            </div>

            {sortedRows.map((row) => {
              const fees = calculateCommissionForRow(row, feeBasis, ruleSettings);
              const estimatedCommission = fees.totalOwed;
              const isApproved = !!approvedRows[row.key];
              const status: CommissionStatus = rowStatuses[row.key] ?? "Paid-Deposit";
              const isPaid = !!paidFlags[row.key];

              const rowBaseClasses =
                "grid grid-cols-[minmax(0,2fr)_minmax(0,0.9fr)_auto_minmax(0,1.6fr)_minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,0.7fr)] items-center gap-2 border-b border-slate-100 px-4 py-2 text-xs transition";
              const rowStateClasses = isPaid
                ? " bg-slate-50 text-slate-400 italic"
                : isApproved
                  ? " bg-emerald-50/60 text-slate-900"
                  : " bg-white text-slate-900";

              return (
                <div key={row.key} className={rowBaseClasses + rowStateClasses}>
                  <div className="break-words whitespace-normal font-medium text-slate-900">
                    {row.orderName} ({row.orderNumber})
                  </div>
                  <div className="text-xs text-slate-500">
                    {row.collectionDate ? formatShortDate(row.collectionDate) : "—"}
                  </div>
                  <div className="flex items-center justify-center">
                    {row.rep ? (
                      <div className={getRepBadgeClasses(row.rep)}>{row.rep}</div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                  <div className="break-words whitespace-normal text-slate-700">
                    {row.referrer || "—"}
                  </div>
                  <div className="text-right font-medium text-emerald-700">
                    {formatCurrency(row.collected)}
                  </div>
                  <div className="text-right font-medium text-slate-700">
                    {formatCurrency(estimatedCommission)}
                  </div>
                  <div className="text-xs font-medium text-slate-700">
                    <select
                      value={status}
                      onChange={(e) =>
                        setRowStatuses((prev) => ({
                          ...prev,
                          [row.key]: e.target.value as CommissionStatus,
                        }))
                      }
                      className="h-8 w-full rounded-md border border-slate-200 bg-white pl-2 pr-6 text-left text-xs focus:outline-none focus:ring-2 focus:ring-sky-300"
                    >
                      {COMMISSION_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isPaid}
                      onCheckedChange={(checked) =>
                        setPaidFlags((prev) => ({ ...prev, [row.key]: !!checked }))
                      }
                      className="border-slate-300 data-[state=checked]:bg-sky-700 data-[state=checked]:border-sky-700 data-[state=checked]:text-white"
                    />
                  </div>
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isApproved}
                      onCheckedChange={(checked) =>
                        setApprovedRows((prev) => ({ ...prev, [row.key]: !!checked }))
                      }
                      className="border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white"
                    />
                  </div>
                </div>
              );
            })}

            {sortedRows.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                No commission orders match your search.
              </div>
            )}
          </CardContent>
        </Card>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="flex max-h-[80vh] max-w-lg flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Commission settings (prototype)
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 space-y-4 overflow-y-auto pr-1 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-slate-500">
                Rule status
              </Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={ruleSettings.active}
                  onCheckedChange={(checked) =>
                    setRuleSettings((prev) => ({ ...prev, active: !!checked }))
                  }
                />
                <span className="text-slate-700">Rule is active</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-slate-500">
                Base amount
              </Label>
              <select
                value={ruleSettings.baseAmount}
                onChange={(e) => {
                  const next = e.target.value === "billed" ? "billed" : "collected";
                  setRuleSettings((prev) => ({ ...prev, baseAmount: next }));
                  setFeeBasis(next);
                }}
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                <option value="collected">Collected (amount received)</option>
                <option value="billed">Billed (invoice total)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-slate-500">
                Net of
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={ruleSettings.netReferralFees}
                    onCheckedChange={(checked) =>
                      setRuleSettings((prev) => ({ ...prev, netReferralFees: !!checked }))
                    }
                  />
                  <span className="text-slate-700">Referral fees</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={ruleSettings.netProgramFees}
                    onCheckedChange={(checked) =>
                      setRuleSettings((prev) => ({ ...prev, netProgramFees: !!checked }))
                    }
                  />
                  <span className="text-slate-700">Program fees</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={ruleSettings.netDiscounts}
                    onCheckedChange={(checked) =>
                      setRuleSettings((prev) => ({ ...prev, netDiscounts: !!checked }))
                    }
                  />
                  <span className="text-slate-700">Discounts</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={ruleSettings.netTaxes}
                    onCheckedChange={(checked) =>
                      setRuleSettings((prev) => ({ ...prev, netTaxes: !!checked }))
                    }
                  />
                  <span className="text-slate-700">Taxes</span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-slate-500">
                Percentage type
              </Label>
              <select
                value={ruleSettings.percentageType}
                onChange={() =>
                  setRuleSettings((prev) => ({ ...prev, percentageType: "variable" }))
                }
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                <option value="variable">Variable</option>
              </select>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Variable rates by order type
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Repeat customer (%)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.25}
                    className="h-8 text-xs"
                    value={ruleSettings.repeatCustomerPercent}
                    onChange={(e) =>
                      setRuleSettings((prev) => ({
                        ...prev,
                        repeatCustomerPercent: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">New source</Label>
                  <div className="flex gap-2">
                    <select
                      value={ruleSettings.newSourceUnit}
                      onChange={(e) =>
                        setRuleSettings((prev) => ({
                          ...prev,
                          newSourceUnit: e.target.value as PercentageUnit,
                        }))
                      }
                      className="h-8 w-16 rounded-md border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-300"
                    >
                      <option value="%">%</option>
                      <option value="$">$</option>
                    </select>
                    <Input
                      type="number"
                      min={0}
                      step={0.25}
                      className="h-8 flex-1 text-xs"
                      value={ruleSettings.newSourceValue}
                      onChange={(e) =>
                        setRuleSettings((prev) => ({
                          ...prev,
                          newSourceValue: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Rep generated</Label>
                  <div className="flex gap-2">
                    <select
                      value={ruleSettings.repGeneratedUnit}
                      onChange={(e) =>
                        setRuleSettings((prev) => ({
                          ...prev,
                          repGeneratedUnit: e.target.value as PercentageUnit,
                        }))
                      }
                      className="h-8 w-16 rounded-md border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-300"
                    >
                      <option value="%">%</option>
                      <option value="$">$</option>
                    </select>
                    <Input
                      type="number"
                      min={0}
                      step={0.25}
                      className="h-8 flex-1 text-xs"
                      value={ruleSettings.repGeneratedValue}
                      onChange={(e) =>
                        setRuleSettings((prev) => ({
                          ...prev,
                          repGeneratedValue: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-slate-500">
                Notes
              </Label>
              <textarea
                className="h-16 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                value={ruleSettings.notes}
                onChange={(e) =>
                  setRuleSettings((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSettingsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppPageLayout>
  );
}
