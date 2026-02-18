import { useState } from "react";
import { Plus, Settings, SlidersHorizontal, Users } from "lucide-react";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { useGlobalSearch } from "@/contexts/GlobalSearchContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const REFERRAL_STATUS_OPTIONS = [
  "Paid-Deposit",
  "Paid-Partial Paid",
  "Paid (unbilled)",
  "Sup (unbilled)",
  "Paid in Full",
  "Sent to Collections",
] as const;

type ReferralStatus = (typeof REFERRAL_STATUS_OPTIONS)[number];

const RAW_TRANSACTIONS = [
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

type ReferralOrderRow = {
  key: string;
  refCompany: string;
  referrer: string;
  orderName: string;
  orderNumber: string;
  billed: number;
  collected: number;
  salesRep: string;
};

type RelationshipType = "none" | "company-only" | "referrer-only" | "pay-both";
type CalculationBasis = "percent" | "flat";

type ReferralRuleSettings = {
  relationshipType: RelationshipType;
  calculationBasis: CalculationBasis;
  companyPercent: number;
  referrerPercent: number;
  flatFeeAmount: number;
  payOnPartial: boolean;
  eligibleCategories: string;
  companyPayableTo: string;
  companyMailingAddress: string;
  referrerPayableTo: string;
  referrerMailingAddress: string;
  notes: string;
  active: boolean;
};

function buildReferralOrderRows(transactions: Transaction[]): ReferralOrderRow[] {
  const map: Record<string, ReferralOrderRow> = {};

  transactions.forEach((tx) => {
    const refCompanyRaw = tx.refCo || tx.referrer || "(No referral company)";
    const refCompany = refCompanyRaw.trim();
    const referrer = (tx.referrer || "").trim();
    if (!refCompany && !referrer) return;

    const key = `${refCompany}__${tx.orderNumber}`;

    if (!map[key]) {
      map[key] = {
        key,
        refCompany,
        referrer,
        orderName: tx.orderName,
        orderNumber: tx.orderNumber,
        billed: 0,
        collected: 0,
        salesRep: tx.salesRep || "",
      };
    } else if (!map[key].salesRep && tx.salesRep) {
      map[key].salesRep = tx.salesRep;
    }

    if (tx.transactionType === "Bill") map[key].billed += tx.total;
    if (tx.transactionType === "Paid") map[key].collected += tx.total;
  });

  return Object.values(map)
    .filter((row) => row.collected > 0)
    .sort((a, b) => {
      const byCompany = a.refCompany.localeCompare(b.refCompany);
      if (byCompany !== 0) return byCompany;
      return a.orderName.localeCompare(b.orderName);
    });
}

function calculateReferralFeesForRow(
  row: ReferralOrderRow,
  feeBasis: "billed" | "collected",
  settings: ReferralRuleSettings
) {
  const eligibleRevenue = feeBasis === "collected" ? row.collected : row.billed;
  const includesCompany =
    settings.relationshipType === "company-only" ||
    settings.relationshipType === "pay-both";
  const includesReferrer =
    settings.relationshipType === "referrer-only" ||
    settings.relationshipType === "pay-both";

  let companyOwed = 0;
  let referrerOwed = 0;

  if (!settings.active) return { companyOwed, referrerOwed, totalOwed: 0 };

  if (settings.calculationBasis === "flat") {
    if (includesCompany) companyOwed = settings.flatFeeAmount || 0;
    if (includesReferrer) referrerOwed = settings.flatFeeAmount || 0;
  } else {
    if (includesCompany) companyOwed = eligibleRevenue * (settings.companyPercent / 100);
    if (includesReferrer) referrerOwed = eligibleRevenue * (settings.referrerPercent / 100);
  }

  return { companyOwed, referrerOwed, totalOwed: companyOwed + referrerOwed };
}

export default function ReferralFeesApp() {
  const { query: searchTerm } = useGlobalSearch();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [feeBasis, setFeeBasis] = useState<"billed" | "collected">("collected");
  const [ruleSettings, setRuleSettings] = useState<ReferralRuleSettings>({
    relationshipType: "pay-both",
    calculationBasis: "percent",
    companyPercent: 8,
    referrerPercent: 4,
    flatFeeAmount: 250,
    payOnPartial: false,
    eligibleCategories: '["cleaning","packout","contents","structural"]',
    companyPayableTo: "",
    companyMailingAddress: "",
    referrerPayableTo: "",
    referrerMailingAddress: "",
    notes: "",
    active: true,
  });

  const [approvedFees, setApprovedFees] = useState<Record<string, boolean>>({});
  const [referralStatuses, setReferralStatuses] = useState<Record<string, ReferralStatus>>({});
  const [referralPaidFlags, setReferralPaidFlags] = useState<Record<string, boolean>>({});
  const [archivedRowKeys, setArchivedRowKeys] = useState<Record<string, boolean>>({});
  const [lastUpdateSummary, setLastUpdateSummary] = useState<string | null>(null);

  const baseRows = buildReferralOrderRows(SAMPLE_TRANSACTIONS);
  const allRows = baseRows.filter((row) => !archivedRowKeys[row.key]);

  const stats = allRows.reduce(
    (acc, row) => {
      const approved = !!approvedFees[row.key];
      const paid = !!referralPaidFlags[row.key];
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
    const haystack = [row.refCompany, row.referrer, row.orderName, row.orderNumber]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    const aApproved = !!approvedFees[a.key];
    const bApproved = !!approvedFees[b.key];
    if (aApproved !== bApproved) return aApproved ? 1 : -1;
    const byCompany = a.refCompany.localeCompare(b.refCompany);
    if (byCompany !== 0) return byCompany;
    return a.orderName.localeCompare(b.orderName);
  });

  const handleSubmitToExpenses = () => {
    const rowsToArchive = allRows.filter(
      (row) => approvedFees[row.key] && !referralPaidFlags[row.key]
    );
    if (rowsToArchive.length === 0) {
      setLastUpdateSummary("No approved referral fees to submit.");
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
      `Submitted ${rowsToArchive.length} referral fee${rowsToArchive.length === 1 ? "" : "s"} to Expenses.`
    );
  };

  return (
    <AppPageLayout icon={Users} title="Referral Fees">
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
              Fee settings
            </Button>
          </div>
        </div>
        <CardHeader className="px-4 pt-3 pb-2">
          <CardTitle className="text-sm font-semibold">
            Referral orders & referral fees
          </CardTitle>
        </CardHeader>
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

            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1.8fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,1.5fr)_minmax(0,0.7fr)_minmax(0,0.7fr)] items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div>Referral Company</div>
              <div>Referrer</div>
              <div>Order</div>
              <div className="text-right">Collected</div>
              <div className="text-right">Estimated Fee</div>
              <div className="text-right">Status</div>
              <div className="text-center">Referral Paid?</div>
              <div className="text-center">Approve</div>
            </div>

            {sortedRows.map((row, index) => {
              const fees = calculateReferralFeesForRow(row, feeBasis, ruleSettings);
              const estimatedFee = fees.totalOwed;
              const isApproved = !!approvedFees[row.key];
              const status: ReferralStatus = referralStatuses[row.key] ?? "Paid-Deposit";
              const isReferralPaid = !!referralPaidFlags[row.key];
              const showCompany =
                index === 0 || sortedRows[index - 1].refCompany !== row.refCompany;

              const rowBaseClasses =
                "grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1.8fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,1.5fr)_minmax(0,0.7fr)_minmax(0,0.7fr)] items-center gap-2 border-b border-slate-100 px-4 py-2 text-xs transition";
              const rowStateClasses = isReferralPaid
                ? " bg-slate-50 text-slate-400 italic"
                : isApproved
                  ? " bg-emerald-50/60 text-slate-900"
                  : " bg-white text-slate-900";

              return (
                <div key={row.key} className={rowBaseClasses + rowStateClasses}>
                  <div className="truncate font-medium text-slate-900">
                    {showCompany ? row.refCompany : ""}
                  </div>
                  <div className="truncate text-slate-700">{row.referrer || "—"}</div>
                  <div className="truncate text-slate-700">
                    {row.orderName} ({row.orderNumber})
                  </div>
                  <div className="text-right font-medium text-emerald-700">
                    {formatCurrency(row.collected)}
                  </div>
                  <div className="text-right font-medium text-slate-700">
                    {formatCurrency(estimatedFee)}
                  </div>
                  <div className="text-right text-xs font-medium text-slate-700">
                    <select
                      value={status}
                      onChange={(e) =>
                        setReferralStatuses((prev) => ({
                          ...prev,
                          [row.key]: e.target.value as ReferralStatus,
                        }))
                      }
                      className="h-8 w-full rounded-md border border-slate-200 bg-white pl-2 pr-6 text-left text-xs focus:outline-none focus:ring-2 focus:ring-sky-300"
                    >
                      {REFERRAL_STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isReferralPaid}
                      onCheckedChange={(checked) =>
                        setReferralPaidFlags((prev) => ({ ...prev, [row.key]: !!checked }))
                      }
                      className="border-slate-300 data-[state=checked]:bg-sky-700 data-[state=checked]:border-sky-700 data-[state=checked]:text-white"
                    />
                  </div>
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isApproved}
                      onCheckedChange={(checked) =>
                        setApprovedFees((prev) => ({ ...prev, [row.key]: !!checked }))
                      }
                      className="border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white"
                    />
                  </div>
                </div>
              );
            })}

            {sortedRows.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                No referral orders match your search.
              </div>
            )}
          </CardContent>
        </Card>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="flex max-h-[80vh] max-w-lg flex-col">
          <DialogHeader>
            <DialogTitle>
              Referral fee settings (prototype)
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
                Relationship type
              </Label>
              <select
                value={ruleSettings.relationshipType}
                onChange={(e) =>
                  setRuleSettings((prev) => ({
                    ...prev,
                    relationshipType: e.target.value as RelationshipType,
                  }))
                }
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                <option value="none">No referral fee</option>
                <option value="company-only">Company only</option>
                <option value="referrer-only">Referrer only</option>
                <option value="pay-both">Pay company & referrer</option>
              </select>
              <p className="text-xs text-slate-500">
                Controls whether the company, referrer, or both receive fees.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-slate-500">
                Revenue basis
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={feeBasis === "billed" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setFeeBasis("billed")}
                >
                  % of billed
                </Button>
                <Button
                  type="button"
                  variant={feeBasis === "collected" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setFeeBasis("collected")}
                >
                  % of collected
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-slate-500">
                Calculation type
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={ruleSettings.calculationBasis === "percent" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() =>
                    setRuleSettings((prev) => ({ ...prev, calculationBasis: "percent" }))
                  }
                >
                  Percent of revenue
                </Button>
                <Button
                  type="button"
                  variant={ruleSettings.calculationBasis === "flat" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() =>
                    setRuleSettings((prev) => ({ ...prev, calculationBasis: "flat" }))
                  }
                >
                  Flat fee per job
                </Button>
              </div>
            </div>

            {ruleSettings.calculationBasis === "percent" && (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide text-slate-500">
                    Company percent
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.25}
                      className="h-8 text-xs"
                      value={ruleSettings.companyPercent}
                      onChange={(e) =>
                        setRuleSettings((prev) => ({
                          ...prev,
                          companyPercent: Number(e.target.value) || 0,
                        }))
                      }
                    />
                    <span className="text-slate-600">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide text-slate-500">
                    Referrer percent
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.25}
                      className="h-8 text-xs"
                      value={ruleSettings.referrerPercent}
                      onChange={(e) =>
                        setRuleSettings((prev) => ({
                          ...prev,
                          referrerPercent: Number(e.target.value) || 0,
                        }))
                      }
                    />
                    <span className="text-slate-600">%</span>
                  </div>
                </div>
              </div>
            )}

            {ruleSettings.calculationBasis === "flat" && (
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-slate-500">
                  Flat fee amount per job
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">$</span>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    className="h-8 text-xs"
                    value={ruleSettings.flatFeeAmount}
                    onChange={(e) =>
                      setRuleSettings((prev) => ({
                        ...prev,
                        flatFeeAmount: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-slate-500">
                Partial payments
              </Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={ruleSettings.payOnPartial}
                  onCheckedChange={(checked) =>
                    setRuleSettings((prev) => ({ ...prev, payOnPartial: !!checked }))
                  }
                />
                <span className="text-slate-700">Pay pro-rata on partial collections</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-slate-500">
                Eligible categories
              </Label>
              <textarea
                className="h-16 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                value={ruleSettings.eligibleCategories}
                onChange={(e) =>
                  setRuleSettings((prev) => ({ ...prev, eligibleCategories: e.target.value }))
                }
              />
              <p className="text-xs text-slate-500">
                JSON list, e.g. [&quot;cleaning&quot;,&quot;packout&quot;,&quot;contents&quot;,&quot;structural&quot;].
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-slate-500">
                  Company payable to
                </Label>
                <Input
                  className="h-8 text-xs"
                  value={ruleSettings.companyPayableTo}
                  onChange={(e) =>
                    setRuleSettings((prev) => ({ ...prev, companyPayableTo: e.target.value }))
                  }
                />
                <textarea
                  className="mt-1 h-14 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                  placeholder="Mailing address (optional)"
                  value={ruleSettings.companyMailingAddress}
                  onChange={(e) =>
                    setRuleSettings((prev) => ({
                      ...prev,
                      companyMailingAddress: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-slate-500">
                  Referrer payable to
                </Label>
                <Input
                  className="h-8 text-xs"
                  value={ruleSettings.referrerPayableTo}
                  onChange={(e) =>
                    setRuleSettings((prev) => ({ ...prev, referrerPayableTo: e.target.value }))
                  }
                />
                <textarea
                  className="mt-1 h-14 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                  placeholder="Mailing address (optional)"
                  value={ruleSettings.referrerMailingAddress}
                  onChange={(e) =>
                    setRuleSettings((prev) => ({
                      ...prev,
                      referrerMailingAddress: e.target.value,
                    }))
                  }
                />
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
